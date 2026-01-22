-- Create invoice_files table for storing invoice metadata
CREATE TABLE IF NOT EXISTS invoice_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(100) NOT NULL,
  organization_id UUID NOT NULL,
  customer_name VARCHAR(255),
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  invoice_date DATE NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Create unique constraint on organization_id and invoice_number
  UNIQUE(organization_id, invoice_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoice_files_organization_id ON invoice_files(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoice_files_invoice_date ON invoice_files(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_files_uploaded_at ON invoice_files(uploaded_at);

-- Create storage bucket for invoices if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for invoice_files table
ALTER TABLE invoice_files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access invoices from their organization
CREATE POLICY "Users can access invoices from their organization" ON invoice_files
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE owner_id = auth.uid()
    )
  );

-- Storage policies for invoices bucket
CREATE POLICY "Users can upload invoices to their organization folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invoices from their organization folder" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete invoices from their organization folder" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations 
      WHERE owner_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_invoice_files_updated_at 
  BEFORE UPDATE ON invoice_files 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();