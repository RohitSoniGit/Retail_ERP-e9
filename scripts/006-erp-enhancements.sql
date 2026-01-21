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
