import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient()
    const testOrgId = '00000000-0000-0000-0000-000000000000'
    
    // Try the combination that got furthest (category + rate + date) with proper UUID
    const testData = {
      organization_id: testOrgId,
      category: "gold",
      rate_per_unit: 5000,
      unit: "gram", 
      effective_date: "2024-01-26"
    }
    
    const { data, error } = await supabase
      .from('daily_rates')
      .insert(testData)
      .select()
    
    if (error) {
      // Try without unit field
      const testData2 = {
        organization_id: testOrgId,
        category: "gold",
        rate_per_unit: 5000,
        effective_date: "2024-01-26"
      }
      
      const { data: data2, error: error2 } = await supabase
        .from('daily_rates')
        .insert(testData2)
        .select()
      
      if (error2) {
        return NextResponse.json({
          success: false,
          test1: { error: error.message, code: error.code },
          test2: { error: error2.message, code: error2.code },
          message: "Both tests failed, checking what columns exist..."
        })
      } else {
        // Success with test2 - clean up and return structure
        if (data2 && data2.length > 0) {
          await supabase
            .from('daily_rates')
            .delete()
            .eq('id', data2[0].id)
        }
        
        return NextResponse.json({
          success: true,
          structure: "organization_id, category, rate_per_unit, effective_date",
          workingData: testData2,
          insertedData: data2
        })
      }
    } else {
      // Success with test1 - clean up and return structure
      if (data && data.length > 0) {
        await supabase
          .from('daily_rates')
          .delete()
          .eq('id', data[0].id)
      }
      
      return NextResponse.json({
        success: true,
        structure: "organization_id, category, rate_per_unit, unit, effective_date",
        workingData: testData,
        insertedData: data
      })
    }
    
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error 
    }, { status: 500 })
  }
}