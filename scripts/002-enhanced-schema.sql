-- Enhanced Inventory Admin Panel Schema
-- Adds Customers, Vouchers, Daily Bhav, and Accounting support

-- Customers Table (for maintaining customer ledger)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  state_code TEXT NOT NULL DEFAULT '07',
  address TEXT,
  gstin TEXT,
  customer_type TEXT DEFAULT 'retail', -- retail, wholesale, walk-in
  opening_balance DECIMAL(12,2) DEFAULT 0, -- For existing credit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Bhav (Daily Rates for commodities like Gold/Silver)
CREATE TABLE IF NOT EXISTS daily_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- gold, silver, commodity_name
  rate_per_unit DECIMAL(12,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'gram', -- gram, kg, piece
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, category, effective_date)
);

-- Vouchers (for Receipt/Payment to settle Udhari)
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  voucher_number TEXT NOT NULL,
  voucher_type TEXT NOT NULL, -- receipt, payment
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT, -- Snapshot for receipts without customer record
  amount DECIMAL(12,2) NOT NULL,
  payment_mode TEXT DEFAULT 'cash', -- cash, upi, bank_transfer, cheque
  reference_number TEXT, -- UPI ref, cheque number, etc.
  narration TEXT,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL, -- Link to specific sale if settling
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, voucher_number)
);

-- Cash Register (Daily cash tracking)
CREATE TABLE IF NOT EXISTS cash_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  register_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_balance DECIMAL(12,2) DEFAULT 0,
  cash_in DECIMAL(12,2) DEFAULT 0, -- Cash sales + receipts
  cash_out DECIMAL(12,2) DEFAULT 0, -- Payments + expenses
  closing_balance DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, register_date)
);

-- Add customer_id to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Add daily_bhav support to items
ALTER TABLE items ADD COLUMN IF NOT EXISTS uses_daily_rate BOOLEAN DEFAULT FALSE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS daily_rate_category TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS making_charges DECIMAL(12,2) DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3) DEFAULT 0;

-- Add purchase_cost snapshot to sale_items (for P&L)
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS purchase_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 0;

-- Add is_paid column to sales if not exists
ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT TRUE;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_daily_rates_org ON daily_rates(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_rates_date ON daily_rates(organization_id, effective_date);
CREATE INDEX IF NOT EXISTS idx_vouchers_org ON vouchers(organization_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cash_register_org ON cash_register(organization_id);

-- Enable RLS for new tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Allow all for customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all for daily_rates" ON daily_rates FOR ALL USING (true);
CREATE POLICY "Allow all for vouchers" ON vouchers FOR ALL USING (true);
CREATE POLICY "Allow all for cash_register" ON cash_register FOR ALL USING (true);

-- Insert demo customers
INSERT INTO customers (organization_id, name, phone, state_code, customer_type, opening_balance)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Walk-in Customer', NULL, '07', 'walk-in', 0),
  ('00000000-0000-0000-0000-000000000001', 'Rahul Sharma', '9876543211', '07', 'retail', 0),
  ('00000000-0000-0000-0000-000000000001', 'Priya Gupta', '9876543212', '07', 'retail', 0),
  ('00000000-0000-0000-0000-000000000001', 'Amit Kumar', '9876543213', '07', 'retail', 444.00),
  ('00000000-0000-0000-0000-000000000001', 'Sunita Devi', '9876543214', '09', 'retail', 0),
  ('00000000-0000-0000-0000-000000000001', 'Metro Wholesale', '9876543215', '07', 'wholesale', 0)
ON CONFLICT DO NOTHING;

-- Insert demo daily rates
INSERT INTO daily_rates (organization_id, category, rate_per_unit, unit, effective_date)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'gold_24k', 7250.00, 'gram', CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000001', 'gold_22k', 6650.00, 'gram', CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000001', 'silver', 92.00, 'gram', CURRENT_DATE)
ON CONFLICT (organization_id, category, effective_date) DO NOTHING;

-- Insert today's cash register
INSERT INTO cash_register (organization_id, register_date, opening_balance, cash_in, cash_out, closing_balance)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  CURRENT_DATE,
  5000.00,
  3717.00,
  500.00,
  8217.00
) ON CONFLICT (organization_id, register_date) DO NOTHING;
