import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient()
    
    // Test if daily_rates table exists and works
    const { data, error } = await supabase
      .from('daily_rates')
      .select('*')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        success: false,
        tableExists: false,
        error: error.message,
        needsTable: error.code === '42P01' || error.message.includes('does not exist'),
        sql: `-- Run this SQL in Supabase to create the daily_rates table:
CREATE TABLE daily_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rate_name TEXT NOT NULL,
  rate_per_unit DECIMAL(12,2) NOT NULL,
  unit TEXT DEFAULT 'gram',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_rates_org ON daily_rates(organization_id);
CREATE INDEX idx_daily_rates_date ON daily_rates(organization_id, effective_date);

ALTER TABLE daily_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for daily_rates" ON daily_rates FOR ALL USING (true);`
      })
    }
    
    // Test insert
    const testOrgId = '00000000-0000-0000-0000-000000000000'
    const { data: insertData, error: insertError } = await supabase
      .from('daily_rates')
      .insert({
        organization_id: testOrgId,
        rate_name: 'Test Gold',
        rate_per_unit: 5000,
        unit: 'gram',
        effective_date: new Date().toISOString().split('T')[0]
      })
      .select()
    
    if (insertError) {
      return NextResponse.json({
        success: false,
        tableExists: true,
        canInsert: false,
        error: insertError.message
      })
    }
    
    // Clean up test data
    if (insertData && insertData.length > 0) {
      await supabase
        .from('daily_rates')
        .delete()
        .eq('id', insertData[0].id)
    }
    
    return NextResponse.json({
      success: true,
      tableExists: true,
      canInsert: true,
      message: 'daily_rates table is working properly',
      testData: insertData
    })
    
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error 
    }, { status: 500 })
  }
}