-- Create commodity_prices table for daily commodity rates
CREATE TABLE IF NOT EXISTS commodity_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  commodity_name TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_commodity_prices_org ON commodity_prices(organization_id);
CREATE INDEX IF NOT EXISTS idx_commodity_prices_date ON commodity_prices(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_commodity_prices_name ON commodity_prices(organization_id, commodity_name);

-- Enable RLS
ALTER TABLE commodity_prices ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Allow all for commodity_prices" ON commodity_prices;
CREATE POLICY "Allow all for commodity_prices" ON commodity_prices FOR ALL USING (true);

-- Add comment
COMMENT ON TABLE commodity_prices IS 'Daily commodity rates for gold, silver, etc.';