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

-- Insert a demo organization
INSERT INTO organizations (id, name, gst_number, state_code, address, phone)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Retail Store',
  '07AAACA1234A1Z5',
  '07',
  '123 Main Market, New Delhi',
  '9876543210'
) ON CONFLICT DO NOTHING;

-- Insert demo items
INSERT INTO items (organization_id, sku, name, category, wholesale_price, retail_price, current_stock, unit_type, units_per_box, gst_rate)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'SKU001', 'Tata Salt 1kg', 'Grocery', 18.00, 22.00, 50, 'piece', 1, 5.00),
  ('00000000-0000-0000-0000-000000000001', 'SKU002', 'Fortune Oil 1L', 'Grocery', 140.00, 165.00, 25, 'piece', 1, 5.00),
  ('00000000-0000-0000-0000-000000000001', 'SKU003', 'Parle-G Biscuit', 'Snacks', 8.00, 10.00, 100, 'piece', 24, 18.00),
  ('00000000-0000-0000-0000-000000000001', 'SKU004', 'Amul Butter 500g', 'Dairy', 240.00, 275.00, 8, 'piece', 1, 12.00),
  ('00000000-0000-0000-0000-000000000001', 'SKU005', 'Colgate Toothpaste', 'Personal Care', 85.00, 99.00, 30, 'piece', 12, 18.00),
  ('00000000-0000-0000-0000-000000000001', 'SKU006', 'Maggi Noodles Box', 'Snacks', 240.00, 288.00, 5, 'box', 24, 18.00),
  ('00000000-0000-0000-0000-000000000001', 'SKU007', 'Surf Excel 1kg', 'Detergent', 180.00, 210.00, 15, 'piece', 1, 28.00),
  ('00000000-0000-0000-0000-000000000001', 'SKU008', 'Red Label Tea 500g', 'Beverages', 220.00, 255.00, 20, 'piece', 1, 5.00)
ON CONFLICT (organization_id, sku) DO NOTHING;

-- Insert demo sales
INSERT INTO sales (organization_id, invoice_number, customer_name, customer_phone, customer_state_code, subtotal, cgst_amount, sgst_amount, igst_amount, total_amount, payment_mode, is_credit, credit_paid)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'INV-001', 'Rahul Sharma', '9876543211', '07', 500.00, 45.00, 45.00, 0, 590.00, 'cash', false, 0),
  ('00000000-0000-0000-0000-000000000001', 'INV-002', 'Priya Gupta', '9876543212', '07', 1200.00, 108.00, 108.00, 0, 1416.00, 'upi', false, 0),
  ('00000000-0000-0000-0000-000000000001', 'INV-003', 'Amit Kumar', '9876543213', '07', 800.00, 72.00, 72.00, 0, 944.00, 'credit', true, 500.00),
  ('00000000-0000-0000-0000-000000000001', 'INV-004', 'Sunita Devi', '9876543214', '09', 650.00, 0, 0, 117.00, 767.00, 'cash', false, 0)
ON CONFLICT (organization_id, invoice_number) DO NOTHING;
