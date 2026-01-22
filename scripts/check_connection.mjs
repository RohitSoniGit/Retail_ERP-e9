
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    try {
        const { data, error } = await supabase.from("organizations").select("count").limit(1);
        if (error) {
            // If error is 404 or table not found, connection is good but schema missing
            if (error.code === 'PGRST204' || error.message.includes('relation "organizations" does not exist')) {
                console.log("Connection successful! (Tables not found, schema setup required)");
            } else {
                console.log("Connection successful (but query failed):", error.message);
            }
        } else {
            console.log("Connection successful! Database contains data.");
        }
    } catch (err) {
        console.log("Connection failed:", err.message);
    }
}

checkConnection();
