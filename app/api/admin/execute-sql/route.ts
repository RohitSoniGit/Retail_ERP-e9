import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json()
    
    if (!sql) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 })
    }
    
    const supabase = getSupabaseServiceClient()
    
    // For security, only allow specific DDL operations
    const allowedOperations = [
      'ALTER TABLE items ADD COLUMN is_commodity',
      'UPDATE items SET is_commodity'
    ]
    
    const isAllowed = allowedOperations.some(op => sql.includes(op))
    
    if (!isAllowed) {
      return NextResponse.json({ error: 'SQL operation not allowed' }, { status: 403 })
    }
    
    // Try to execute using a function call (if available)
    const { data, error } = await supabase.rpc('execute_sql', { query: sql })
    
    if (error) {
      console.error('SQL execution error:', error)
      return NextResponse.json({ error: 'SQL execution failed', details: error }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}