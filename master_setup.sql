-- Inventory Admin Panel Schema for Small Retailers
-- Multi-tenant with organization_id filtering

-- Organizations (Shop Owners)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gst_number TEXT,
  state_code TEXT NOT NULL DEFAULT '07', -- Delhi default
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items/Products Inventory
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  wholesale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  retail_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  unit_type TEXT NOT NULL DEFAULT 'piece', -- piece, box, kg, etc.
  units_per_box INTEGER DEFAULT 1, -- For unit conversion (1 Box = X Pieces)
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00, -- GST percentage
  hsn_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, sku)
);

-- Sales/Bills
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_state_code TEXT DEFAULT '07',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  cgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  sgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  igst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_mode TEXT DEFAULT 'cash', -- cash, upi, card, credit
  is_credit BOOLEAN DEFAULT FALSE, -- Udhari flag
  credit_paid DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, invoice_number)
);

-- Sale Items (Line Items)
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  purchase_cost DECIMAL(12,2) NOT NULL, -- Snapshot of wholesale price for P&L
  gst_rate DECIMAL(5,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Movements (for tracking additions/removals)
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL, -- Positive for additions, negative for sales
  movement_type TEXT NOT NULL, -- 'purchase', 'sale', 'adjustment', 'return'
  reference_id UUID, -- sale_id or purchase_id
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_org ON items(organization_id);
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(organization_id, sku);
CREATE INDEX IF NOT EXISTS idx_sales_org ON sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allowing all for demo, in production link to auth.uid())
CREATE POLICY "Allow all for organizations" ON organizations FOR ALL USING (true);
CREATE POLICY "Allow all for items" ON items FOR ALL USING (true);
CREATE POLICY "Allow all for sales" ON sales FOR ALL USING (true);
CREATE POLICY "Allow all for sale_items" ON sale_items FOR ALL USING (true);
CREATE POLICY "Allow all for stock_movements" ON stock_movements FOR ALL USING (true);

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

-- Purchase Management Schema
-- Complete purchase cycle with suppliers, purchase orders, and advance payments

-- Suppliers table
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
  payment_terms INTEGER DEFAULT 30, -- days
  credit_limit DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0, -- positive = we owe them
  supplier_type TEXT DEFAULT 'regular' CHECK (supplier_type IN ('regular', 'manufacturer', 'distributor', 'importer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, supplier_code)
);

-- Purchase Orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  po_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partial', 'completed', 'cancelled')),
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
  terms_conditions TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  item_name TEXT NOT NULL,
  hsn_code TEXT,
  quantity DECIMAL(10,3) NOT NULL,
  unit_name TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  gst_rate DECIMAL(5,2) DEFAULT 18,
  cgst_amount DECIMAL(10,2) DEFAULT 0,
  sgst_amount DECIMAL(10,2) DEFAULT 0,
  igst_amount DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL,
  received_quantity DECIMAL(10,3) DEFAULT 0,
  pending_quantity DECIMAL(10,3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Receipts/GRN (Goods Receipt Note)
CREATE TABLE IF NOT EXISTS purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  grn_number TEXT NOT NULL,
  po_id UUID REFERENCES purchase_orders(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  supplier_invoice_number TEXT,
  supplier_invoice_date DATE,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'received', 'quality_check', 'accepted', 'rejected')),
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  cgst_amount DECIMAL(12,2) DEFAULT 0,
  sgst_amount DECIMAL(12,2) DEFAULT 0,
  igst_amount DECIMAL(12,2) DEFAULT 0,
  freight_charges DECIMAL(12,2) DEFAULT 0,
  other_charges DECIMAL(12,2) DEFAULT 0,
  round_off DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  paid_amount DECIMAL(12,2) DEFAULT 0,
  balance_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Receipt Items
CREATE TABLE IF NOT EXISTS purchase_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES purchase_receipts(id) ON DELETE CASCADE,
  po_item_id UUID REFERENCES purchase_order_items(id),
  item_id UUID NOT NULL REFERENCES items(id),
  item_name TEXT NOT NULL,
  hsn_code TEXT,
  ordered_quantity DECIMAL(10,3) DEFAULT 0,
  received_quantity DECIMAL(10,3) NOT NULL,
  accepted_quantity DECIMAL(10,3) DEFAULT 0,
  rejected_quantity DECIMAL(10,3) DEFAULT 0,
  unit_name TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  gst_rate DECIMAL(5,2) DEFAULT 18,
  cgst_amount DECIMAL(10,2) DEFAULT 0,
  sgst_amount DECIMAL(10,2) DEFAULT 0,
  igst_amount DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL,
  expiry_date DATE,
  batch_number TEXT,
  quality_status TEXT DEFAULT 'pending' CHECK (quality_status IN ('pending', 'passed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advance Payments table
CREATE TABLE IF NOT EXISTS advance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_number TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('supplier_advance', 'customer_advance', 'employee_advance')),
  party_id UUID NOT NULL, -- supplier_id, customer_id, or employee_id
  party_name TEXT NOT NULL,
  party_type TEXT NOT NULL CHECK (party_type IN ('supplier', 'customer', 'employee')),
  po_id UUID REFERENCES purchase_orders(id), -- if linked to PO
  advance_amount DECIMAL(12,2) NOT NULL,
  utilized_amount DECIMAL(12,2) DEFAULT 0,
  balance_amount DECIMAL(12,2) DEFAULT 0,
  payment_mode TEXT DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card')),
  reference_number TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  purpose TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'utilized', 'refunded', 'adjusted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Ledger Accounts
CREATE TABLE IF NOT EXISTS ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  account_group TEXT NOT NULL, -- cash, bank, sundry_debtors, sundry_creditors, purchase, sales, etc.
  parent_account_id UUID REFERENCES ledger_accounts(id),
  opening_balance DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  is_system_account BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, account_code)
);

-- Enhanced Ledger Entries (Double Entry Bookkeeping)
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entry_number TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_type TEXT, -- sale, purchase, payment, receipt, journal
  reference_id UUID, -- sale_id, purchase_id, voucher_id, etc.
  reference_number TEXT,
  narration TEXT,
  total_amount DECIMAL(12,2) NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ledger Entry Details (Individual Dr/Cr entries)
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

-- Inventory Valuation Methods
CREATE TABLE IF NOT EXISTS inventory_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  valuation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  method TEXT DEFAULT 'fifo' CHECK (method IN ('fifo', 'lifo', 'weighted_average')),
  opening_stock DECIMAL(10,3) DEFAULT 0,
  opening_value DECIMAL(12,2) DEFAULT 0,
  purchases_qty DECIMAL(10,3) DEFAULT 0,
  purchases_value DECIMAL(12,2) DEFAULT 0,
  sales_qty DECIMAL(10,3) DEFAULT 0,
  sales_value DECIMAL(12,2) DEFAULT 0,
  closing_stock DECIMAL(10,3) DEFAULT 0,
  closing_value DECIMAL(12,2) DEFAULT 0,
  average_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, item_id, valuation_date)
);

-- Batch/Lot Tracking
CREATE TABLE IF NOT EXISTS item_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  batch_number TEXT NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE,
  supplier_id UUID REFERENCES suppliers(id),
  purchase_receipt_id UUID REFERENCES purchase_receipts(id),
  purchase_price DECIMAL(10,2),
  quantity_received DECIMAL(10,3) NOT NULL,
  quantity_available DECIMAL(10,3) NOT NULL,
  quantity_sold DECIMAL(10,3) DEFAULT 0,
  quantity_damaged DECIMAL(10,3) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'damaged', 'recalled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, item_id, batch_number)
);

-- Enable RLS on all new tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entry_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_batches ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables
CREATE POLICY "Allow all for suppliers" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all for purchase_orders" ON purchase_orders FOR ALL USING (true);
CREATE POLICY "Allow all for purchase_order_items" ON purchase_order_items FOR ALL USING (true);
CREATE POLICY "Allow all for purchase_receipts" ON purchase_receipts FOR ALL USING (true);
CREATE POLICY "Allow all for purchase_receipt_items" ON purchase_receipt_items FOR ALL USING (true);
CREATE POLICY "Allow all for advance_payments" ON advance_payments FOR ALL USING (true);
CREATE POLICY "Allow all for ledger_accounts" ON ledger_accounts FOR ALL USING (true);
CREATE POLICY "Allow all for ledger_entries" ON ledger_entries FOR ALL USING (true);
CREATE POLICY "Allow all for ledger_entry_details" ON ledger_entry_details FOR ALL USING (true);
CREATE POLICY "Allow all for inventory_valuations" ON inventory_valuations FOR ALL USING (true);
CREATE POLICY "Allow all for item_batches" ON item_batches FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_org_id ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org_id ON purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_org_id ON purchase_receipts(organization_id);
CREATE INDEX IF NOT EXISTS idx_advance_payments_org_id ON advance_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_org_id ON ledger_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_valuations_org_item ON inventory_valuations(organization_id, item_id);
CREATE INDEX IF NOT EXISTS idx_item_batches_org_item ON item_batches(organization_id, item_id);

-- Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Category to Items
ALTER TABLE items ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Create Job Cards Table
CREATE TABLE IF NOT EXISTS job_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id), -- Optional, can be walk-in
  customer_name TEXT,
  job_number TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered')) DEFAULT 'pending',
  date_in TIMESTAMPTZ DEFAULT NOW(),
  date_out TIMESTAMPTZ,
  notes TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  final_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Job Card Items (Items given for job work or used in job work)
CREATE TABLE IF NOT EXISTS job_card_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL, -- Can be a free text for "Gold Ring" etc.
  quantity NUMERIC NOT NULL DEFAULT 1,
  type TEXT CHECK (type IN ('inward', 'outward', 'service')) NOT NULL, -- Inward: Received from customer, Outward: Given to worker/Returned, Service: Cost
  cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Non-GST Flag to Sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_gst_bill BOOLEAN DEFAULT TRUE;