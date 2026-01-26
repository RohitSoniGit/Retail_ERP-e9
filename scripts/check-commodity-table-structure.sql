-- Check the actual structure of commodity_prices table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'commodity_prices' 
ORDER BY ordinal_position;

-- Also check if the table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'commodity_prices';