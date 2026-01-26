const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addCommodityColumn() {
  try {
    console.log('Adding is_commodity column to items table...')
    
    // First, let's check if we can access the items table
    const { data: items, error: selectError } = await supabase
      .from('items')
      .select('id')
      .limit(1)
    
    if (selectError) {
      console.error('Error accessing items table:', selectError)
      return
    }
    
    console.log('Items table accessible. Found', items?.length || 0, 'items')
    
    // Since we can't run DDL through the client, let's provide instructions
    console.log('\nTo add the commodity column, please run this SQL in your Supabase SQL editor:')
    console.log('\nALTER TABLE items ADD COLUMN is_commodity BOOLEAN DEFAULT FALSE;')
    console.log('\nAfter running this SQL, the commodity checkbox feature will work properly.')
    
  } catch (err) {
    console.error('Error:', err)
  }
}

addCommodityColumn()