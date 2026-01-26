import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    
    const supabase = getSupabaseServiceClient()
    
    // Get all daily_rates data
    const { data: allData, error: allError } = await supabase
      .from('daily_rates')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Get data for specific organization if provided
    let orgData = null
    let orgError = null
    
    if (organizationId) {
      const { data, error } = await supabase
        .from('daily_rates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('effective_date', { ascending: false })
      
      orgData = data
      orgError = error
    }
    
    return NextResponse.json({
      success: true,
      allData: {
        count: allData?.length || 0,
        data: allData || [],
        error: allError?.message
      },
      organizationData: organizationId ? {
        organizationId,
        count: orgData?.length || 0,
        data: orgData || [],
        error: orgError?.message
      } : null
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error 
    }, { status: 500 })
  }
}