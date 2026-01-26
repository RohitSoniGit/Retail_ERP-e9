-- Add is_commodity field to items table
-- This allows items to be marked as commodities where pricing is not required

-- Add the column (will fail silently if column already exists)
ALTER TABLE items ADD COLUMN is_commodity BOOLEAN DEFAULT FALSE;

-- Update existing items to have is_commodity = false by default
UPDATE items SET is_commodity = FALSE WHERE is_commodity IS NULL;

-- Add comment to the column
COMMENT ON COLUMN items.is_commodity IS 'Indicates if this item is a commodity that does not require fixed pricing';