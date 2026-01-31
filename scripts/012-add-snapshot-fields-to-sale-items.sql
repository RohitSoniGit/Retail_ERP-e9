-- Add snapshot fields to sale_items table to preserve item details at time of sale
ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS item_name TEXT,
ADD COLUMN IF NOT EXISTS hsn_code TEXT,
ADD COLUMN IF NOT EXISTS unit_name TEXT,
ADD COLUMN IF NOT EXISTS is_commodity BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS commodity_price DECIMAL(12,2);

-- Update existing sale_items to populate item_name from items table where possible
UPDATE sale_items si
SET 
  item_name = i.name,
  hsn_code = i.hsn_code,
  unit_name = i.unit_type
FROM items i
WHERE si.item_id = i.id AND si.item_name IS NULL;
