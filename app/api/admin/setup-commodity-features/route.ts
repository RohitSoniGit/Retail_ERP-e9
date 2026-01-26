import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient()
    
    const results = {
      itemsColumnCheck: null as any,
      commodityTableCheck: null as any,
      sqlToRun: [] as string[]
    }
    
    // Check 1: is_commodity column in items table
    try {
      const { error: itemsError } = await supabase
        .from('items')
        .select('is_commodity')
        .limit(1)
      
      if (itemsError && itemsError.message.includes('column "is_commodity" does not exist')) {
        results.itemsColumnCheck = {
          exists: false,
          message: 'is_commodity column missing from items table'
        }
        results.sqlToRun.push('ALTER TABLE items ADD COLUMN is_commodity BOOLEAN DEFAULT FALSE;')
      } else {
        results.itemsColumnCheck = {
          exists: true,
          message: 'is_commodity column exists in items table'
        }
      }
    } catch (e) {
      results.itemsColumnCheck = {
        exists: false,
        error: e
      }
    }
    
    // Check 2: commodity_prices table
    try {
      const { error: tableError } = await supabase
        .from('commodity_prices')
        .select('id')
        .limit(1)
      
      if (tableError && (tableError.message.includes('relation "commodity_prices" does not exist') || tableError.code === '42P01')) {
        results.commodityTableCheck = {
          exists: false,
          message: 'commodity_prices table does not exist'
        }
        results.sqlToRun.push(`
-- Create commodity_prices table
CREATE TABLE IF NOT EXISTS commodity_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  commodity_name TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_commodity_prices_org ON commodity_prices(organization_id);
CREATE INDEX IF NOT EXISTS idx_commodity_prices_date ON commodity_prices(organization_id, date);

-- Enable RLS
ALTER TABLE commodity_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for commodity_prices" ON commodity_prices FOR ALL USING (true);`)
      } else {
        results.commodityTableCheck = {
          exists: true,
          message: 'commodity_prices table exists'
        }
      }
    } catch (e) {
      results.commodityTableCheck = {
        exists: false,
        error: e
      }
    }
    
    return NextResponse.json({
      success: results.sqlToRun.length === 0,
      results,
      needsSetup: results.sqlToRun.length > 0,
      sqlToRun: results.sqlToRun.join('\n\n'),
      message: results.sqlToRun.length === 0 
        ? 'All commodity features are properly set up!' 
        : `Found ${results.sqlToRun.length} missing database components. Please run the provided SQL.`
    })
    
  } catch (error) {
    console.error('Error checking commodity setup:', error)
    return NextResponse.json({ 
      error: 'Failed to check commodity setup', 
      details: error 
    }, { status: 500 })
  }
}