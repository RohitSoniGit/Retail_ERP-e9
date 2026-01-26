-- Create daily_rates table as an alternative to commodity_prices
CREATE TABLE IF NOT EXISTS daily_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rate_name TEXT NOT NULL,
  rate_per_unit DECIMAL(12,2) NOT NULL,
  unit TEXT DEFAULT 'gram',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_rates_org ON daily_rates(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_rates_date ON daily_rates(organization_id, effective_date);

-- Enable RLS
ALTER TABLE daily_rates ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all for daily_rates" ON daily_rates;
CREATE POLICY "Allow all for daily_rates" ON daily_rates FOR ALL USING (true);