import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient()
    
    // Try to add the is_commodity column
    // We'll use a workaround by trying to insert a test record and see what happens
    const testData = {
      organization_id: 'test',
      sku: 'TEST_COMMODITY_CHECK',
      name: 'Test Commodity Check',
      wholesale_price: 0,
      retail_price: 0,
      purchase_cost: 0,
      current_stock: 0,
      unit_type: 'pcs',
      pieces_per_unit: 1,
      gst_rate: 18,
      is_commodity: true
    }
    
    // Try to insert with is_commodity field
    const { error } = await supabase
      .from('items')
      .insert(testData)
    
    if (error) {
      if (error.message.includes('column "is_commodity" does not exist')) {
        return NextResponse.json({
          success: false,
          needsColumn: true,
          message: 'The is_commodity column does not exist in the items table.',
          sql: 'ALTER TABLE items ADD COLUMN is_commodity BOOLEAN DEFAULT FALSE;',
          instructions: 'Please run this SQL in your Supabase SQL editor to add the missing column.'
        })
      } else {
        // Some other error, but column might exist
        return NextResponse.json({
          success: true,
          message: 'Column appears to exist (got different error)',
          error: error.message
        })
      }
    } else {
      // Success - column exists, now delete the test record
      await supabase
        .from('items')
        .delete()
        .eq('sku', 'TEST_COMMODITY_CHECK')
      
      return NextResponse.json({
        success: true,
        message: 'is_commodity column exists and is working properly'
      })
    }
    
  } catch (error) {
    console.error('Error checking commodity column:', error)
    return NextResponse.json({ 
      error: 'Failed to check column', 
      details: error 
    }, { status: 500 })
  }
}