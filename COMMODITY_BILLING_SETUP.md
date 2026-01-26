# Commodity Billing Feature Setup

This document explains how to set up and use the enhanced commodity billing feature that supports weight-based pricing for items like gold, silver, and other commodities.

## Overview

The commodity billing feature allows you to:
- Mark items as commodities that don't require fixed pricing
- Set daily commodity prices (e.g., gold rate per gram)
- Scan/select commodity items and specify weight during billing
- Automatically calculate amount based on weight × commodity price
- Support both regular items and commodity items in the same bill

## Database Setup Required

### Step 1: Add Commodity Support to Items Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Add is_commodity column to items table
ALTER TABLE items ADD COLUMN is_commodity BOOLEAN DEFAULT FALSE;

-- Update existing items to have is_commodity = false
UPDATE items SET is_commodity = FALSE WHERE is_commodity IS NULL;

-- Add comment to the column
COMMENT ON COLUMN items.is_commodity IS 'Indicates if this item is a commodity that does not require fixed pricing';
```

### Step 2: Create Commodity Prices Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create commodity_prices table for daily commodity rates
CREATE TABLE IF NOT EXISTS commodity_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  commodity_name TEXT NOT NULL,
  category TEXT,
  price_per_unit DECIMAL(12,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'gram',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, commodity_name, category, date)
);

-- Add weight column to sale_items for commodity support
ALTER TABLE sale_items ADD COLUMN weight DECIMAL(10,3);
ALTER TABLE sale_items ADD COLUMN commodity_price DECIMAL(12,2);
ALTER TABLE sale_items ADD COLUMN is_commodity BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_commodity_prices_org_date ON commodity_prices(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_commodity_prices_name ON commodity_prices(organization_id, commodity_name);

-- Enable RLS
ALTER TABLE commodity_prices ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all for commodity_prices" ON commodity_prices FOR ALL USING (true);

-- Add comments
COMMENT ON TABLE commodity_prices IS 'Daily commodity prices for weight-based pricing';
COMMENT ON COLUMN commodity_prices.commodity_name IS 'Name of the commodity (e.g., Gold, Silver)';
COMMENT ON COLUMN commodity_prices.category IS 'Category or grade (e.g., 22K Gold, 925 Silver)';
COMMENT ON COLUMN commodity_prices.price_per_unit IS 'Price per unit weight';
COMMENT ON COLUMN commodity_prices.unit IS 'Unit of measurement (gram, kg, tola, etc.)';
COMMENT ON COLUMN sale_items.weight IS 'Weight for commodity items';
COMMENT ON COLUMN sale_items.commodity_price IS 'Price per unit for commodity items';
COMMENT ON COLUMN sale_items.is_commodity IS 'Indicates if this sale item is a commodity';
```

## How to Use the Feature

### 1. Set Up Commodity Items

1. Go to **Items** page
2. Click **Add Item**
3. Fill in the item details (name, SKU, category, etc.)
4. Check the **"Commodity Item"** checkbox
5. The Cost/Wholesale/Retail fields will be hidden (set to 0 automatically)
6. Save the item

### 2. Set Daily Commodity Prices

1. Go to **Commodity Prices** page (new menu item)
2. Click **Add Price**
3. Enter:
   - **Commodity Name**: e.g., "Gold", "Silver"
   - **Category**: e.g., "22K Gold", "925 Silver" (optional)
   - **Price per Unit**: Current market rate
   - **Unit**: gram, kg, tola, etc.
4. Save the price

### 3. Create Bills with Commodity Items

#### For Regular Items:
- Search and select the item
- It will be added directly with fixed pricing

#### For Commodity Items:
- Search and select the commodity item
- A dialog will open asking for:
  - **Commodity Price**: Auto-matched based on item name/category
  - **Weight**: Enter the weight (e.g., 10.5 grams)
  - **Quantity**: Number of pieces (default: 1)
- The system calculates: **Weight × Commodity Price × Quantity = Total Amount**
- Click **Add to Bill**

### 4. Bill Display

Commodity items in the bill will show:
- Item name with a scale icon (🏷️)
- Weight details: "Weight: 10.5 gram × ₹5,500/gram"
- Quantity: "Qty: 1 × ₹57,750"
- Total amount calculated automatically

## Features

### ✅ **Enhanced Item Management**
- Commodity checkbox in item form
- Automatic hiding of pricing fields for commodities
- Visual indicators (scale icon) for commodity items

### ✅ **Daily Price Management**
- Set multiple commodity prices per day
- Support for different categories (22K Gold, 24K Gold, etc.)
- Different units (gram, kg, tola, ounce)

### ✅ **Smart Billing Interface**
- Auto-detection of commodity items
- Weight input dialog for commodities
- Automatic price matching based on item name/category
- Real-time calculation: weight × rate = amount

### ✅ **Mixed Bills Support**
- Regular items and commodity items in same bill
- Proper GST calculation for both types
- Detailed line items showing weight and rates

### ✅ **Database Integration**
- Proper storage of weight and commodity pricing data
- Stock management for commodity items
- Detailed sale reporting with weight information

## Example Workflow

### Jewelry Store Example:

1. **Setup Items:**
   - Create "22K Gold Ring" as commodity item
   - Create "Silver Chain" as commodity item
   - Create "Gift Box" as regular item

2. **Set Daily Rates:**
   - Gold: ₹5,500/gram
   - Silver: ₹75/gram

3. **Create Bill:**
   - Add "22K Gold Ring" → Enter weight: 8.5g → Amount: ₹46,750
   - Add "Silver Chain" → Enter weight: 25g → Amount: ₹1,875
   - Add "Gift Box" → Regular price: ₹50
   - **Total: ₹48,675 + GST**

## Navigation

- **Items**: Manage regular and commodity items
- **Commodity Prices**: Set daily commodity rates
- **Billing**: Create bills with mixed item types

## Troubleshooting

### Common Issues:

1. **"Commodity Item checkbox not visible"**
   - Ensure the database migration was run successfully
   - Check browser console for errors

2. **"No commodity prices available"**
   - Go to Commodity Prices page and add prices for today's date
   - Ensure commodity names match or are similar to item names

3. **"Weight dialog not opening"**
   - Ensure the item is marked as commodity in Items page
   - Check that commodity prices exist for matching commodities

4. **"Price not auto-matching"**
   - Commodity matching is based on item name/category
   - Ensure commodity name contains keywords from item name
   - Example: Item "Gold Ring" matches commodity "Gold"

## API Endpoints

- `GET /api/commodity-prices` - Fetch daily prices
- `POST /api/commodity-prices` - Add/update prices
- Enhanced sale items now include weight and commodity pricing data

The enhanced billing system now fully supports both traditional fixed-price items and modern commodity-based weight pricing, making it perfect for jewelry stores, precious metals dealers, and other commodity-based businesses.