-- Safe Enhanced Schema Migration
-- Adds new tables and columns without breaking existing data

-- Add new columns to customers table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'credit_limit') THEN
    ALTER TABLE customers ADD COLUMN credit_limit decimal(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'current_balance') THEN
    ALTER TABLE customers ADD COLUMN current_balance decimal(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_type') THEN
    ALTER TABLE customers ADD COLUMN customer_type text DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale', 'both'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'state_code') THEN
    ALTER TABLE customers ADD COLUMN state_code text DEFAULT '27';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'gstin') THEN
    ALTER TABLE customers ADD COLUMN gstin text;
  END IF;
END $$;

-- Add new columns to items table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'hsn_code') THEN
    ALTER TABLE items ADD COLUMN hsn_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'gst_rate') THEN
    ALTER TABLE items ADD COLUMN gst_rate decimal(5,2) DEFAULT 18;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'mrp') THEN
    ALTER TABLE items ADD COLUMN mrp decimal(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'is_rate_linked') THEN
    ALTER TABLE items ADD COLUMN is_rate_linked boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'category') THEN
    ALTER TABLE items ADD COLUMN category text;
  END IF;
END $$;

-- Add new columns to sales table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'invoice_number') THEN
    ALTER TABLE sales ADD COLUMN invoice_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'customer_state') THEN
    ALTER TABLE sales ADD COLUMN customer_state text DEFAULT '27';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'cgst_amount') THEN
    ALTER TABLE sales ADD COLUMN cgst_amount decimal(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'sgst_amount') THEN
    ALTER TABLE sales ADD COLUMN sgst_amount decimal(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'igst_amount') THEN
    ALTER TABLE sales ADD COLUMN igst_amount decimal(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount_amount') THEN
    ALTER TABLE sales ADD COLUMN discount_amount decimal(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'round_off') THEN
    ALTER TABLE sales ADD COLUMN round_off decimal(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'notes') THEN
    ALTER TABLE sales ADD COLUMN notes text;
  END IF;
END $$;

-- Create daily_rates table for commodity pricing (Daily Bhav)
CREATE TABLE IF NOT EXISTS daily_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  rate_date date NOT NULL DEFAULT CURRENT_DATE,
  rate decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, item_id, rate_date)
);

-- Create vouchers table for accounting
CREATE TABLE IF NOT EXISTS vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  voucher_number text NOT NULL,
  voucher_type text NOT NULL CHECK (voucher_type IN ('receipt', 'payment', 'journal', 'contra')),
  voucher_date date NOT NULL DEFAULT CURRENT_DATE,
  party_id uuid REFERENCES customers(id),
  amount decimal(12,2) NOT NULL,
  narration text,
  reference_type text,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Create cash_register for daily cash tracking
CREATE TABLE IF NOT EXISTS cash_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  register_date date NOT NULL DEFAULT CURRENT_DATE,
  opening_balance decimal(12,2) DEFAULT 0,
  closing_balance decimal(12,2),
  cash_sales decimal(12,2) DEFAULT 0,
  cash_received decimal(12,2) DEFAULT 0,
  cash_paid decimal(12,2) DEFAULT 0,
  notes text,
  is_closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, register_date)
);

-- Create sale_items table if not exists (with enhanced columns)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'discount_percent') THEN
    ALTER TABLE sale_items ADD COLUMN discount_percent decimal(5,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'gst_rate') THEN
    ALTER TABLE sale_items ADD COLUMN gst_rate decimal(5,2) DEFAULT 18;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE daily_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Allow all for daily_rates" ON daily_rates;
DROP POLICY IF EXISTS "Allow all for vouchers" ON vouchers;
DROP POLICY IF EXISTS "Allow all for cash_register" ON cash_register;

CREATE POLICY "Allow all for daily_rates" ON daily_rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for vouchers" ON vouchers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for cash_register" ON cash_register FOR ALL USING (true) WITH CHECK (true);

-- Insert sample customers if not exist
INSERT INTO customers (organization_id, name, phone, state_code, customer_type, credit_limit)
SELECT 
  (SELECT id FROM organizations LIMIT 1),
  name,
  phone,
  '27',
  'retail',
  5000
FROM (VALUES 
  ('Walk-in Customer', '0000000000'),
  ('Ramesh Traders', '9876543210'),
  ('Suresh Wholesale', '9876543211'),
  ('Mahesh Store', '9876543212')
) AS v(name, phone)
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = v.name);

-- Update existing items with GST info
UPDATE items SET 
  hsn_code = COALESCE(hsn_code, '8471'),
  gst_rate = COALESCE(gst_rate, 18),
  category = COALESCE(category, 'General')
WHERE hsn_code IS NULL;
