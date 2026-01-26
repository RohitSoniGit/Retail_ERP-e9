import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient()
    
    // Try to get table structure by selecting all columns with a limit
    const { data, error } = await supabase
      .from('commodity_prices')
      .select('*')
      .limit(0) // Get structure without data
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code
      })
    }
    
    // Try a simple insert to see what columns are expected
    const testData = {
      organization_id: '00000000-0000-0000-0000-000000000000',
      commodity_name: 'Test',
      // Try different possible column names
    }
    
    // Test with different column names
    const tests = [
      { ...testData, price: 100 },
      { ...testData, rate: 100 },
      { ...testData, amount: 100 },
      { ...testData, value: 100 }
    ]
    
    const results = []
    
    for (const test of tests) {
      try {
        const { error: insertError } = await supabase
          .from('commodity_prices')
          .insert(test)
        
        if (insertError) {
          results.push({
            test: Object.keys(test).join(', '),
            success: false,
            error: insertError.message
          })
        } else {
          results.push({
            test: Object.keys(test).join(', '),
            success: true,
            message: 'Insert successful'
          })
          
          // Clean up
          await supabase
            .from('commodity_prices')
            .delete()
            .eq('organization_id', '00000000-0000-0000-0000-000000000000')
            .eq('commodity_name', 'Test')
        }
      } catch (e) {
        results.push({
          test: Object.keys(test).join(', '),
          success: false,
          error: e
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      tableExists: true,
      columnTests: results
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error 
    }, { status: 500 })
  }
}