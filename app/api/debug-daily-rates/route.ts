import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient()
    
    // Try different column combinations based on common patterns
    const testCombinations = [
      // Pattern 1: Based on master_setup.sql patterns
      {
        name: "item_id + rate_date + rate",
        data: {
          organization_id: "test-org",
          item_id: null,
          rate_date: "2024-01-26",
          purchase_rate: 5000,
          selling_rate: 5100
        }
      },
      // Pattern 2: Simple rate structure
      {
        name: "category + rate + date",
        data: {
          organization_id: "test-org", 
          category: "gold",
          rate_per_unit: 5000,
          unit: "gram",
          effective_date: "2024-01-26"
        }
      },
      // Pattern 3: Rate name structure
      {
        name: "rate_name + rate_per_unit",
        data: {
          organization_id: "test-org",
          rate_name: "Gold 24K",
          rate_per_unit: 5000,
          unit: "gram",
          effective_date: "2024-01-26"
        }
      }
    ]
    
    const results = []
    
    for (const test of testCombinations) {
      try {
        const { data, error } = await supabase
          .from('daily_rates')
          .insert(test.data)
          .select()
        
        if (error) {
          results.push({
            test: test.name,
            success: false,
            error: error.message,
            code: error.code
          })
        } else {
          results.push({
            test: test.name,
            success: true,
            message: "Insert successful",
            data: data
          })
          
          // Clean up
          if (data && data.length > 0) {
            await supabase
              .from('daily_rates')
              .delete()
              .eq('id', data[0].id)
          }
        }
      } catch (e) {
        results.push({
          test: test.name,
          success: false,
          error: String(e)
        })
      }
    }
    
    return NextResponse.json({
      message: "Testing different column combinations for daily_rates table",
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