import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient()
    
    // Check if column already exists by trying to select it
    const { error: testError } = await supabase
      .from('items')
      .select('is_commodity')
      .limit(1)
    
    if (testError && testError.message.includes('column "is_commodity" does not exist')) {
      // Column doesn't exist, we need to add it
      // Since we can't run DDL directly, return instructions
      return NextResponse.json({ 
        success: false,
        needsMigration: true,
        message: 'Column is_commodity does not exist. Please run the following SQL in your Supabase SQL editor:',
        sql: 'ALTER TABLE items ADD COLUMN is_commodity BOOLEAN DEFAULT FALSE;'
      })
    }
    
    if (testError) {
      console.error('Error checking column:', testError)
      return NextResponse.json({ error: 'Error checking database', details: testError }, { status: 500 })
    }
    
    // Column exists
    return NextResponse.json({ 
      success: true, 
      message: 'Column is_commodity already exists'
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Migration failed', details: error }, { status: 500 })
  }
}