# Commodity Feature Setup

This document explains how to set up the commodity feature for items.

## What is the Commodity Feature?

The commodity feature allows you to mark items as "commodities" - items that don't require fixed pricing (Cost, Wholesale, Retail). When an item is marked as a commodity, the pricing fields are hidden in the form.

## Database Setup Required

To enable this feature, you need to add a new column to the `items` table in your Supabase database.

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query

### Step 2: Run the Migration SQL

Copy and paste the following SQL into the editor and run it:

```sql
-- Add is_commodity column to items table
ALTER TABLE items ADD COLUMN is_commodity BOOLEAN DEFAULT FALSE;

-- Update existing items to have is_commodity = false
UPDATE items SET is_commodity = FALSE WHERE is_commodity IS NULL;

-- Add comment to the column (optional)
COMMENT ON COLUMN items.is_commodity IS 'Indicates if this item is a commodity that does not require fixed pricing';
```

### Step 3: Verify the Setup

After running the SQL, you can verify the setup by:

1. Going to the Items page in your application
2. Clicking "Add Item"
3. You should see a "Commodity Item" checkbox
4. When checked, the Cost/Wholesale/Retail fields should be hidden

## How to Use

1. **Regular Items**: Leave the "Commodity Item" checkbox unchecked and fill in all pricing fields
2. **Commodity Items**: Check the "Commodity Item" checkbox - the pricing fields will be hidden and set to 0 automatically

## Troubleshooting

If you encounter any issues:

1. Make sure the SQL was executed successfully in Supabase
2. Check the browser console for any errors
3. Refresh the page after adding the database column

## API Endpoint for Testing

You can test if the column exists by making a POST request to:
```
POST /api/migrate/commodity
```

This will return information about whether the column exists or needs to be added.