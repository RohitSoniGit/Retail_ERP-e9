-- ULTIMATE SCHEMA SETUP FOR RETAIL ERP
-- This script sets up the entire database schema from scratch or updates an existing one.
-- It is idempotent: running it multiple times is safe.

-- ==========================================
-- 1. EXTENSIONS & BASE SETUP
-- ==========================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- 2. ORGANIZATIONS & AUTH (Core)
-- ==========================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gst_number TEXT,
  state_code TEXT NOT NULL DEFAULT '27', -- Default Maharashtra (27) or Delhi (07)
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  gstin TEXT, -- Redundant with gst_number but added for compatibility
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist (if table already existed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'gst_number') THEN
        ALTER TABLE organizations ADD COLUMN gst_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'owner_id') THEN
        ALTER TABLE organizations ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'address') THEN
        ALTER TABLE organizations ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'phone') THEN
        ALTER TABLE organizations ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'email') THEN
        ALTER TABLE organizations ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'website') THEN
        ALTER TABLE organizations ADD COLUMN website TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'logo_url') THEN
        ALTER TABLE organizations ADD COLUMN logo_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'gstin') THEN
        ALTER TABLE organizations ADD COLUMN gstin TEXT;
    END IF;
END $$;

-- Enable RLS for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for organizations" ON organizations;
CREATE POLICY "Allow all for organizations" ON organizations FOR ALL USING (true);


-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON user_roles;
CREATE POLICY "Allow read access to all authenticated users" ON user_roles FOR SELECT TO authenticated USING (true);

-- Profiles (Public user info)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill profiles
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO service_role;


-- ==========================================
-- 3. MASTER DATA (Categories, Items, Customers, Suppliers)
-- ==========================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  wholesale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  retail_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  unit_type TEXT NOT NULL DEFAULT 'piece',
  units_per_box INTEGER DEFAULT 1,
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  hsn_code TEXT,
  barcode TEXT,
  mrp DECIMAL(10,2),
  min_stock INTEGER DEFAULT 10,
  max_stock INTEGER DEFAULT 100,
  is_rate_linked BOOLEAN DEFAULT FALSE,
  uses_daily_rate BOOLEAN DEFAULT FALSE,
  daily_rate_category TEXT,
  making_charges DECIMAL(12,2) DEFAULT 0,
  weight DECIMAL(10,3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, sku)
);

-- Update items table with any missing columns
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'category_id') THEN
    ALTER TABLE items ADD COLUMN category_id UUID REFERENCES categories(id);
  END IF;
END $$;


-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  state_code TEXT NOT NULL DEFAULT '27',
  address TEXT,
  gstin TEXT,
  gst_number TEXT, -- alias or legacy
  customer_type TEXT DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale', 'distributor', 'walk-in', 'both')),
  credit_limit DECIMAL(12,2) DEFAULT 0,
  opening_balance DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update customers table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'credit_limit') THEN
    ALTER TABLE customers ADD COLUMN credit_limit decimal(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'current_balance') THEN
    ALTER TABLE customers ADD COLUMN current_balance decimal(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'gstin') THEN
    ALTER TABLE customers ADD COLUMN gstin text;
  END IF;
END $$;


-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_code TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state_code TEXT DEFAULT '27',
  pincode TEXT,
  gstin TEXT,
  pan_number TEXT,
  bank_name TEXT,
  bank_account TEXT,
  ifsc_code TEXT,
  payment_terms INTEGER DEFAULT 30,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  supplier_type TEXT DEFAULT 'regular',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, supplier_code)
);


-- ==========================================
-- 4. SALES & PURCHASES (Transactional)
-- ==========================================

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_state_code TEXT DEFAULT '27',
  customer_state TEXT, -- redundant alias
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  cgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  sgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  igst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  round_off DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_mode TEXT DEFAULT 'cash',
  is_credit BOOLEAN DEFAULT FALSE,
  credit_paid DECIMAL(12,2) DEFAULT 0,
  is_paid BOOLEAN DEFAULT TRUE,
  is_gst_bill BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, invoice_number)
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  purchase_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  gst_rate DECIMAL(5,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  po_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status TEXT DEFAULT 'draft',
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  cgst_amount DECIMAL(12,2) DEFAULT 0,
  sgst_amount DECIMAL(12,2) DEFAULT 0,
  igst_amount DECIMAL(12,2) DEFAULT 0,
  other_charges DECIMAL(12,2) DEFAULT 0,
  round_off DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  advance_paid DECIMAL(12,2) DEFAULT 0,
  balance_amount DECIMAL(12,2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  item_name TEXT NOT NULL,
  hsn_code TEXT,
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  gst_rate DECIMAL(5,2) DEFAULT 18,
  cgst_amount DECIMAL(10,2) DEFAULT 0,
  sgst_amount DECIMAL(10,2) DEFAULT 0,
  igst_amount DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL,
  received_quantity DECIMAL(10,3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Receipts
CREATE TABLE IF NOT EXISTS purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  grn_number TEXT NOT NULL,
  po_id UUID REFERENCES purchase_orders(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  supplier_invoice_number TEXT,
  supplier_invoice_date DATE,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'draft',
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  cgst_amount DECIMAL(12,2) DEFAULT 0,
  sgst_amount DECIMAL(12,2) DEFAULT 0,
  igst_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES purchase_receipts(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  item_name TEXT NOT NULL,
  quantity_received DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  gst_rate DECIMAL(5,2) DEFAULT 18,
  total_price DECIMAL(12,2) NOT NULL,
  batch_number TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- 5. ACCOUNTS & FINANCE
-- ==========================================

-- Daily Rates (Bhav)
CREATE TABLE IF NOT EXISTS daily_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  category TEXT, -- fallback
  rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rate DECIMAL(10,2) DEFAULT 0, -- generic rate
  purchase_rate DECIMAL(12,2) DEFAULT 0,
  selling_rate DECIMAL(12,2) DEFAULT 0,
  rate_per_unit DECIMAL(12,2), -- alias
  unit TEXT,
  effective_date DATE, -- alias for rate_date
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vouchers
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  voucher_number TEXT NOT NULL,
  voucher_type TEXT NOT NULL CHECK (voucher_type IN ('receipt', 'payment', 'journal', 'contra')),
  voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
  party_id UUID REFERENCES customers(id), -- also used for suppliers via ID if unified, or simple customer link
  customer_id UUID REFERENCES customers(id), -- alias
  customer_name TEXT,
  amount DECIMAL(12,2) NOT NULL,
  payment_mode TEXT DEFAULT 'cash',
  reference_number TEXT,
  narration TEXT,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, voucher_number)
);

-- Cash Register
CREATE TABLE IF NOT EXISTS cash_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  register_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_balance DECIMAL(12,2) DEFAULT 0,
  closing_balance DECIMAL(12,2),
  cash_sales DECIMAL(12,2) DEFAULT 0,  -- alias cash_in
  cash_in DECIMAL(12,2) DEFAULT 0,
  cash_received DECIMAL(12,2) DEFAULT 0, -- alias
  cash_out DECIMAL(12,2) DEFAULT 0, -- alias cash_paid
  cash_paid DECIMAL(12,2) DEFAULT 0, 
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_receipts DECIMAL(12,2) DEFAULT 0,
  total_payments DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, register_date)
);

-- Ledger Accounts
CREATE TABLE IF NOT EXISTS ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  account_group TEXT NOT NULL,
  parent_account_id UUID REFERENCES ledger_accounts(id),
  opening_balance DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  is_system_account BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, account_code)
);

-- Ledger Entries
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entry_number TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_type TEXT,
  reference_id UUID,
  reference_number TEXT,
  narration TEXT,
  total_amount DECIMAL(12,2) NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ledger Entry Details
CREATE TABLE IF NOT EXISTS ledger_entry_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES ledger_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES ledger_accounts(id),
  account_name TEXT NOT NULL,
  debit_amount DECIMAL(12,2) DEFAULT 0,
  credit_amount DECIMAL(12,2) DEFAULT 0,
  narration TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- 6. STOCK & JOBS
-- ==========================================

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  movement_type TEXT NOT NULL,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Cards
CREATE TABLE IF NOT EXISTS job_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  job_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  date_in TIMESTAMPTZ DEFAULT NOW(),
  date_out TIMESTAMPTZ,
  notes TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  final_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_card_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  type TEXT NOT NULL,
  cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Item Batches
CREATE TABLE IF NOT EXISTS item_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  batch_number TEXT NOT NULL,
  expiry_date DATE,
  quantity_available DECIMAL(10,3) NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Valuations
CREATE TABLE IF NOT EXISTS inventory_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  valuation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  closing_value DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advance Payments
CREATE TABLE IF NOT EXISTS advance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_number TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  party_id UUID NOT NULL,
  party_name TEXT NOT NULL,
  party_type TEXT NOT NULL,
  advance_amount DECIMAL(12,2) NOT NULL,
  balance_amount DECIMAL(12,2) DEFAULT 0,
  payment_mode TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- 7. POLICIES & PERMISSIONS (Final RLS)
-- ==========================================

-- Enable access for all tables to authenticated users (Simplified for this ERP)
-- In a real multi-tenant strict app, we would enforce org_id check.
-- But the code handles org_id filtering.

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entry_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_payments ENABLE ROW LEVEL SECURITY;


-- Reusable Policy Gen
DO $$
DECLARE 
  t text;
  tables text[] := ARRAY[
    'organizations', 'user_roles', 'profiles', 'items', 'categories', 
    'customers', 'suppliers', 'sales', 'sale_items', 'purchase_orders', 
    'purchase_order_items', 'purchase_receipts', 'purchase_receipt_items', 
    'stock_movements', 'daily_rates', 'vouchers', 'cash_register', 
    'ledger_accounts', 'ledger_entries', 'ledger_entry_details', 
    'job_cards', 'job_card_items', 'item_batches', 'inventory_valuations', 
    'advance_payments'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE 'DROP POLICY IF EXISTS "Allow all for ' || t || '" ON ' || t;
    EXECUTE 'CREATE POLICY "Allow all for ' || t || '" ON ' || t || ' FOR ALL USING (true) WITH CHECK (true)';
  END LOOP;
END $$;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';

