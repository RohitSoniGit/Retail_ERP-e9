-- Add settings column to organizations table
-- This column stores JSON configuration for the organization

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' 
                   AND column_name = 'settings') THEN
        ALTER TABLE organizations ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
        
        COMMENT ON COLUMN organizations.settings IS 'Organization-specific settings like currency, tax rates, invoice prefix, etc.';
    END IF;
END $$;
