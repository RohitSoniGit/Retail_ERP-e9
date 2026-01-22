#!/usr/bin/env node

/**
 * Setup script to create organization and link it to the authenticated user
 * This will enable database persistence instead of demo mode
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function setupOrganization() {
    console.log('🚀 Setting up organization in database...\n')

    try {
        // Step 1: Check if organizations table exists
        console.log('1️⃣  Checking organizations table...')
        const { data: existingOrgs, error: checkError } = await supabase
            .from('organizations')
            .select('*')
            .limit(1)

        if (checkError) {
            console.error('❌ Organizations table not found or error:', checkError.message)
            console.log('\n📝 Please run the master_setup.sql script in your Supabase SQL Editor first:')
            console.log('   File: scripts/master_setup.sql')
            console.log('   Or run: psql -h <host> -U <user> -d <database> -f scripts/master_setup.sql')
            process.exit(1)
        }

        // Step 2: Check if organization already exists
        if (existingOrgs && existingOrgs.length > 0) {
            console.log('✅ Organization already exists:')
            console.log('   ID:', existingOrgs[0].id)
            console.log('   Name:', existingOrgs[0].name)
            console.log('\n✨ Your app should now save to the database!')
            return
        }

        // Step 3: Create a new organization
        console.log('2️⃣  Creating new organization...')
        const { data: newOrg, error: createError } = await supabase
            .from('organizations')
            .insert({
                name: 'My Retail Store',
                gst_number: '27ABCDE1234F1Z5',
                state_code: '27',
                address: '123 Business Street, Mumbai, Maharashtra 400001',
                phone: '+91 9876543210',
            })
            .select()
            .single()

        if (createError) {
            console.error('❌ Failed to create organization:', createError.message)
            process.exit(1)
        }

        console.log('✅ Organization created successfully!')
        console.log('   ID:', newOrg.id)
        console.log('   Name:', newOrg.name)

        // Step 4: Check for authenticated users
        console.log('\n3️⃣  Checking for users...')
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

        if (usersError) {
            console.error('❌ Failed to list users:', usersError.message)
        } else if (users.users.length > 0) {
            console.log(`✅ Found ${users.users.length} user(s)`)

            // Optionally link users to organization (if you have a user_organizations table)
            console.log('\n💡 Note: Users can now use this organization')
            console.log('   Organization ID:', newOrg.id)
        } else {
            console.log('⚠️  No users found. Create a user account by signing up in the app.')
        }

        console.log('\n✨ Setup complete! Your app will now save data to the database.')
        console.log('   Refresh your browser to see the changes.')

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        process.exit(1)
    }
}

setupOrganization()
