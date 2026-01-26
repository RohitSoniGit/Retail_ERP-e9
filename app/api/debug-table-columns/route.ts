import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient()
    
    // Try to insert with minimal data to see what columns are expected
    const testInserts = [
      // Test 1: Try with 'price' column
      {
        test: "price column",
        data: {
          organization_id: "test-org",
          commodity_name: "Test Gold",
          price: 5000
        }
      },
      // Test 2: Try with 'rate' column (maybe it's named rate?)
      {
        test: "rate column", 
        data: {
          organization_id: "test-org",
          commodity_name: "Test Gold",
          rate: 5000
        }
      },
      // Test 3: Try with 'amount' column
      {
        test: "amount column",
        data: {
          organization_id: "test-org", 
          commodity_name: "Test Gold",
          amount: 5000
        }
      },
      // Test 4: Try with 'value' column
      {
        test: "value column",
        data: {
          organization_id: "test-org",
          commodity_name: "Test Gold", 
          value: 5000
        }
      }
    ]
    
    const results = []
    
    for (const testCase of testInserts) {
      try {
        const { data, error } = await supabase
          .from('commodity_prices')
          .insert(testCase.data)
          .select()
        
        if (error) {
          results.push({
            test: testCase.test,
            success: false,
            error: error.message,
            code: error.code
          })
        } else {
          results.push({
            test: testCase.test,
            success: true,
            data: data
          })
          
          // Clean up successful test data
          if (data && data.length > 0) {
            await supabase
              .from('commodity_prices')
              .delete()
              .eq('id', data[0].id)
          }
        }
      } catch (e) {
        results.push({
          test: testCase.test,
          success: false,
          error: String(e)
        })
      }
    }
    
    return NextResponse.json({
      message: "Testing different column names for commodity_prices table",
      results
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error 
    }, { status: 500 })
  }
}