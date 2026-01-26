import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient()
    
    const results = {
      itemsTable: null as any,
      commodityPricesTable: null as any,
      testInsert: null as any
    }
    
    // Test 1: Check items table has is_commodity column
    try {
      const { data, error } = await supabase
        .from('items')
        .select('id, sku, name, is_commodity')
        .limit(1)
      
      if (error) {
        results.itemsTable = {
          success: false,
          error: error.message,
          needsColumn: error.message.includes('column "is_commodity" does not exist')
        }
      } else {
        results.itemsTable = {
          success: true,
          message: 'Items table with is_commodity column is working',
          sampleData: data
        }
      }
    } catch (e) {
      results.itemsTable = { success: false, error: e }
    }
    
    // Test 2: Check commodity_prices table
    try {
      const { data, error } = await supabase
        .from('commodity_prices')
        .select('*')
        .limit(1)
      
      if (error) {
        results.commodityPricesTable = {
          success: false,
          error: error.message,
          needsTable: error.code === '42P01' || error.message.includes('does not exist')
        }
      } else {
        results.commodityPricesTable = {
          success: true,
          message: 'Commodity prices table is working',
          sampleData: data
        }
      }
    } catch (e) {
      results.commodityPricesTable = { success: false, error: e }
    }
    
    // Test 3: Try to insert a test commodity price
    if (results.commodityPricesTable?.success) {
      try {
        const testOrgId = '00000000-0000-0000-0000-000000000000' // Test org ID
        
        const { data, error } = await supabase
          .from('commodity_prices')
          .insert({
            organization_id: testOrgId,
            commodity_name: 'Test Gold',
            price: 5000,
            date: new Date().toISOString().split('T')[0]
          })
          .select()
        
        if (error) {
          results.testInsert = {
            success: false,
            error: error.message
          }
        } else {
          results.testInsert = {
            success: true,
            message: 'Test insert successful',
            data: data
          }
          
          // Clean up test data
          await supabase
            .from('commodity_prices')
            .delete()
            .eq('organization_id', testOrgId)
            .eq('commodity_name', 'Test Gold')
        }
      } catch (e) {
        results.testInsert = { success: false, error: e }
      }
    }
    
    return NextResponse.json({
      success: results.itemsTable?.success && results.commodityPricesTable?.success,
      results,
      summary: {
        itemsColumnExists: results.itemsTable?.success || false,
        commodityTableExists: results.commodityPricesTable?.success || false,
        canInsertData: results.testInsert?.success || false
      }
    })
    
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error 
    }, { status: 500 })
  }
}