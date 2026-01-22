import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseServiceRoleKey) {
            return NextResponse.json(
                { error: "Service role key not configured" },
                { status: 500 }
            );
        }

        // 1. Verify the current user is an admin
        const cookieStore = await cookies();
        const supabase = createServerClient(
            supabaseUrl,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: userRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        if (userRole?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
        }

        // 2. Parse request body
        const body = await request.json();
        const { email, password, fullName, role } = body;

        if (!email || !password || !fullName || !role) {
            return NextResponse.json(
                { error: "Missing required fields: email, password, fullName, role" },
                { status: 400 }
            );
        }

        // 3. Create the new user using Service Role Client
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        const { data: newUser, error: createError } =
            await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName,
                },
            });

        if (createError) {
            console.error("Supabase createUser error:", createError);
            return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        if (!newUser.user) {
            return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
        }

        // 4. Assign Role
        // The 'user_roles' table assumes RLS. Since we are using service role key here, we bypass RLS.
        const { error: roleError } = await supabaseAdmin
            .from("user_roles")
            .insert({
                user_id: newUser.user.id,
                role: role,
            });

        if (roleError) {
            console.error("Role assignment failed:", roleError);
            // Clean up user if role assignment fails? Or just report error?
            // For now, report error.
            return NextResponse.json({
                message: "User created via Auth, but role assignment failed. Please assign role manually.",
                error: roleError.message
            }, { status: 500 });
        }

        return NextResponse.json({
            user: newUser.user,
            message: "User created successfully"
        });

    } catch (error: any) {
        console.error("Create User API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
