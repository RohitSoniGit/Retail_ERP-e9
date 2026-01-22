// create_admin.mjs
// Create an auth user and mark them as admin in the database.
// Usage:
//   1) Set env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
//   2) Run: node scripts/create_admin.mjs

import 'dotenv/config'; // Requires dotenv to be installed and standard node setup
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual dotenv loading if 'dotenv/config' doesn't pick up .env.local automatically
// (Next.js loads .env.local automatically, but standalone scripts might not)
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    const envConfig = fs.readFileSync(envLocalPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
// We look for SERVICE_ROLE_KEY specifically
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Error: Missing configuration.');
    console.error('Ensure .env.local contains:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL');
    console.error('  SUPABASE_SERVICE_ROLE_KEY (You must add this manually from Supabase Dashboard > Settings > API)');
    process.exit(1);
}

// Credentials to create
const ADMIN_EMAIL = 'Rohitkumarsoni713@gmail.com';
const ADMIN_PASSWORD = 'Rohit@123'; // Provide securely when running in production

async function main() {
    console.log(`Connecting to Supabase at ${SUPABASE_URL}...`);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        },
    });

    try {
        // 1) Create the auth user via Admin API
        console.log(`Creating user ${ADMIN_EMAIL}...`);
        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
        });

        let userId;

        if (createError) {
            // If user already exists, fetch them
            if (createError.status === 422 || (createError.message && createError.message.includes('already registered'))) { // 422 is common for duplicate
                console.warn('User likely already exists. Attempting to look up user by email.');

                const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
                if (listError) throw listError;

                const found = (usersList?.users || []).find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
                if (!found) {
                    throw new Error(`User creation failed with "${createError.message}", and could not find user in list.`);
                }
                console.log('Found existing user:', found.id);
                userId = found.id;
            } else {
                throw createError;
            }
        } else {
            userId = userData.user.id;
            console.log('User created successfully:', userId);
        }

        console.log('User ID is:', userId);

        // 2) Insert or upsert role into public.user_roles
        console.log('Assigning admin role...');

        // Check if user_roles table exists by trying to select from it
        const { error: checkError } = await supabase.from('user_roles').select('id').limit(1);
        if (checkError && checkError.code === '42P01') { // undefined_table
            console.error('Error: public.user_roles table does not exist.');
            console.error('Please run the "scripts/master_setup.sql" script in your Supabase SQL Editor first.');
            process.exit(1);
        }

        const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' })
            .select();

        if (roleError) {
            console.error('Failed to insert role:', roleError);
            process.exit(1);
        }

        console.log('Role assigned successfully:', roleData);

        // 3) Create an organization for the admin user
        console.log('Creating organization for the admin user...');

        // Define organization details
        const orgName = 'My Retail Store';
        const orgData = {
            name: orgName,
            owner_id: userId,
            state_code: '27', // Default to Maharashtra as per demo data
            gst_number: '27ABCDE1234F1Z5' // Demo GST
        };

        // Check if user already owns an organization to avoid duplicates
        const { data: existingOrgs, error: orgCheckError } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('owner_id', userId);

        let orgId;

        if (existingOrgs && existingOrgs.length > 0) {
            console.log(`User already owns ${existingOrgs.length} organization(s). Using the first one: ${existingOrgs[0].name}`);
            orgId = existingOrgs[0].id;
        } else {
            // Insert new organization
            const { data: newOrg, error: orgError } = await supabase
                .from('organizations')
                .insert(orgData)
                .select()
                .single();

            if (orgError) {
                // If error relates to missing column owner_id, warn user
                if (orgError.message && orgError.message.includes('owner_id')) {
                    console.error('Error: Could not set owner_id. The "organizations" table might need a schema update.');
                    console.error('Please run "scripts/007-add-organization-owner.sql" in your Supabase SQL Editor.');
                    // Fallback: try creating without owner_id if that was the issue (though RLS won't work perfectly)
                    console.log('Attempting to create organization without owner_id...');
                    const { name, owner_id, ...fallbackData } = orgData;
                    const { data: fallbackOrg, error: fallbackError } = await supabase
                        .from('organizations')
                        .insert({ name: orgName, ...fallbackData })
                        .select()
                        .single();

                    if (fallbackError) {
                        console.error('Failed to create organization (fallback):', fallbackError);
                    } else {
                        console.log('Organization created (without owner_id):', fallbackOrg);
                        orgId = fallbackOrg.id;
                    }
                } else {
                    console.error('Failed to create organization:', orgError);
                }
            } else {
                console.log('Organization created successfully:', newOrg);
                orgId = newOrg.id;
            }
        }

        console.log('Admin setup complete.');
        console.log(`Email: ${ADMIN_EMAIL}`);

        console.log(`Password: ${ADMIN_PASSWORD}`);

    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

main();
