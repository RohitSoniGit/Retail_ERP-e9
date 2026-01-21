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

-- Insert default ledger accounts
INSERT INTO ledger_accounts (organization_id, account_code, account_name, account_type, account_group, is_system_account)
SELECT 
  o.id,
  code,
  name,
  type,
  grp,
  true
FROM organizations o
CROSS JOIN (VALUES 
  ('CASH', 'Cash in Hand', 'asset', 'cash'),
  ('BANK', 'Bank Account', 'asset', 'bank'),
  ('SUNDRY_DEBTORS', 'Sundry Debtors', 'asset', 'sundry_debtors'),
  ('SUNDRY_CREDITORS', 'Sundry Creditors', 'liability', 'sundry_creditors'),
  ('PURCHASE', 'Purchase Account', 'expense', 'purchase'),
  ('SALES', 'Sales Account', 'income', 'sales'),
  ('CGST_INPUT', 'CGST Input', 'asset', 'tax'),
  ('SGST_INPUT', 'SGST Input', 'asset', 'tax'),
  ('IGST_INPUT', 'IGST Input', 'asset', 'tax'),
  ('CGST_OUTPUT', 'CGST Output', 'liability', 'tax'),
  ('SGST_OUTPUT', 'SGST Output', 'liability', 'tax'),
  ('IGST_OUTPUT', 'IGST Output', 'liability', 'tax'),
  ('ADVANCE_FROM_CUSTOMERS', 'Advance from Customers', 'liability', 'advance'),
  ('ADVANCE_TO_SUPPLIERS', 'Advance to Suppliers', 'asset', 'advance')
) AS v(code, name, type, grp)
WHERE NOT EXISTS (
  SELECT 1 FROM ledger_accounts 
  WHERE organization_id = o.id AND account_code = v.code
);

-- Insert sample suppliers
INSERT INTO suppliers (organization_id, supplier_code, name, phone, address, state_code, supplier_type, credit_limit)
SELECT 
  o.id,
  code,
  name,
  phone,
  address,
  '27',
  'regular',
  50000
FROM organizations o
CROSS JOIN (VALUES 
  ('SUP001', 'ABC Distributors', '9876543210', '123 Wholesale Market, Mumbai'),
  ('SUP002', 'XYZ Traders', '9876543211', '456 Commercial Street, Mumbai'),
  ('SUP003', 'PQR Industries', '9876543212', '789 Industrial Area, Mumbai')
) AS v(code, name, phone, address)
WHERE NOT EXISTS (
  SELECT 1 FROM suppliers 
  WHERE organization_id = o.id AND supplier_code = v.code
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_org_id ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org_id ON purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_org_id ON purchase_receipts(organization_id);
CREATE INDEX IF NOT EXISTS idx_advance_payments_org_id ON advance_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_org_id ON ledger_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_valuations_org_item ON inventory_valuations(organization_id, item_id);
CREATE INDEX IF NOT EXISTS idx_item_batches_org_item ON item_batches(organization_id, item_id);