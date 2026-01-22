-- Setup script for Ronak Jewellers
-- Run this in your Supabase SQL Editor after running master_setup.sql

-- Create default organization only
INSERT INTO organizations (name, gst_number, address, phone, state_code, gstin) 
VALUES (
  'Ronak Jewellers',
  '24ABCDE1234F1Z5',
  '123 Jewellery Market, Surat, Gujarat 395003',
  '+91 9876543210',
  '24',
  '24ABCDE1234F1Z5'
) ON CONFLICT DO NOTHING;