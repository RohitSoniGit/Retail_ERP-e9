import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }
    
    const supabase = getSupabaseServiceClient()
    
    const { data, error } = await supabase
      .from('commodity_prices')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching commodity prices:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, commodity_name, price, date } = body
    
    if (!organizationId || !commodity_name || !price || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const supabase = getSupabaseServiceClient()
    
    const { data, error } = await supabase
      .from('commodity_prices')
      .insert({
        organization_id: organizationId,
        commodity_name,
        price: parseFloat(price),
        date
      })
      .select()
    
    if (error) {
      console.error('Error inserting commodity price:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data, success: true })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }
    
    const supabase = getSupabaseServiceClient()
    
    const { error } = await supabase
      .from('commodity_prices')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting commodity price:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}