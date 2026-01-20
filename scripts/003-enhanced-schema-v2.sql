-- Enhanced Schema v2 - Drop and recreate policies safely

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all for customers" ON customers;
DROP POLICY IF EXISTS "Allow all for daily_rates" ON daily_rates;
DROP POLICY IF EXISTS "Allow all for vouchers" ON vouchers;
DROP POLICY IF EXISTS "Allow all for cash_register" ON cash_register;

-- Create customers table if not exists
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  gst_number TEXT,
  state_code TEXT DEFAULT '07',
  customer_type TEXT DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale', 'distributor')),
  credit_limit DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create daily_rates table (for gold/silver/commodity shops)
CREATE TABLE IF NOT EXISTS daily_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  purchase_rate DECIMAL(12,2) NOT NULL,
  selling_rate DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, item_id, rate_date)
);

-- Create vouchers table for accounting
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  voucher_number TEXT NOT NULL,
  voucher_type TEXT NOT NULL CHECK (voucher_type IN ('receipt', 'payment', 'journal', 'contra')),
  voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID REFERENCES customers(id),
  amount DECIMAL(12,2) NOT NULL,
  narration TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cash_register for daily cash tracking
CREATE TABLE IF NOT EXISTS cash_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  register_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_cash DECIMAL(12,2) DEFAULT 0,
  closing_cash DECIMAL(12,2),
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_receipts DECIMAL(12,2) DEFAULT 0,
  total_payments DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, register_date)
);

-- Add new columns to items if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'hsn_code') THEN
    ALTER TABLE items ADD COLUMN hsn_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'gst_rate') THEN
    ALTER TABLE items ADD COLUMN gst_rate DECIMAL(5,2) DEFAULT 18;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'min_stock') THEN
    ALTER TABLE items ADD COLUMN min_stock INTEGER DEFAULT 10;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'max_stock') THEN
    ALTER TABLE items ADD COLUMN max_stock INTEGER DEFAULT 100;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'barcode') THEN
    ALTER TABLE items ADD COLUMN barcode TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'mrp') THEN
    ALTER TABLE items ADD COLUMN mrp DECIMAL(10,2);
  END IF;
END $$;

-- Add new columns to sales if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'customer_id') THEN
    ALTER TABLE sales ADD COLUMN customer_id UUID REFERENCES customers(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'invoice_number') THEN
    ALTER TABLE sales ADD COLUMN invoice_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount_amount') THEN
    ALTER TABLE sales ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'round_off') THEN
    ALTER TABLE sales ADD COLUMN round_off DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'notes') THEN
    ALTER TABLE sales ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Allow all for customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all for daily_rates" ON daily_rates FOR ALL USING (true);
CREATE POLICY "Allow all for vouchers" ON vouchers FOR ALL USING (true);
CREATE POLICY "Allow all for cash_register" ON cash_register FOR ALL USING (true);

-- Insert demo customers
INSERT INTO customers (organization_id, name, phone, customer_type, credit_limit, current_balance) 
SELECT 
  id,
  'Walk-in Customer',
  NULL,
  'retail',
  0,
  0
FROM organizations
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Walk-in Customer')
LIMIT 1;

INSERT INTO customers (organization_id, name, phone, customer_type, credit_limit, current_balance)
SELECT 
  o.id,
  'Sharma General Store',
  '9876543210',
  'wholesale',
  50000,
  12500
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Sharma General Store')
LIMIT 1;

INSERT INTO customers (organization_id, name, phone, customer_type, credit_limit, current_balance)
SELECT 
  o.id,
  'Rajesh Traders',
  '9988776655',
  'distributor',
  100000,
  25000
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Rajesh Traders')
LIMIT 1;
