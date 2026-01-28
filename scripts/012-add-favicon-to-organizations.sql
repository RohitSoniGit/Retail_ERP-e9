-- Add favicon_url column to organizations table

DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' 
                   AND column_name = 'favicon_url') THEN
        ALTER TABLE organizations ADD COLUMN favicon_url TEXT;
        
        COMMENT ON COLUMN organizations.favicon_url IS 'URL for organization favicon/icon';
    END IF;
END $;