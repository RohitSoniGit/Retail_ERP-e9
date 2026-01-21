# Retail ERP Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **pnpm** package manager
3. **Supabase** account and project

## Database Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2. Run Database Migrations
Execute the SQL scripts in order in your Supabase SQL editor:

1. `scripts/001-inventory-schema.sql` - Basic schema
2. `scripts/002-enhanced-schema.sql` - Enhanced features
3. `scripts/003-enhanced-schema-v2.sql` - Additional tables
4. `scripts/004-safe-enhanced-schema.sql` - Final enhancements

### 3. Create Sample Organization
Run this SQL to create a sample organization:

```sql
INSERT INTO organizations (name, gst_number, address, phone, state_code, gstin) 
VALUES (
  'My Retail Store',
  '27ABCDE1234F1Z5',
  '123 Main Street, Mumbai, Maharashtra 400001',
  '+91 9876543210',
  '27',
  '27ABCDE1234F1Z5'
);
```

## Environment Configuration

1. Copy `.env.local` and update with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Installation & Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

## Features Completed

✅ **Dashboard**
- Sales statistics and trends
- Low stock alerts
- Recent transactions
- 7-day sales chart

✅ **Items Management**
- Add/edit items with GST rates
- Stock management
- Quick stock addition
- Low stock tracking

✅ **Billing System**
- GST-compliant invoicing
- Customer selection
- Multiple payment modes
- Credit sales (Udhari)
- Thermal receipt printing

✅ **Customer Management**
- Customer profiles with credit limits
- Customer ledger with transaction history
- Payment collection
- Credit balance tracking

✅ **Vouchers & Accounting**
- Receipt and payment vouchers
- Daily cash tracking
- Voucher numbering system

✅ **Reports**
- Day book with all transactions
- Profit/loss analysis
- Credit sales (Udhari) tracking
- Item-wise profit margins

✅ **Multi-tenant Support**
- Organization-based data isolation
- GST state code management
- Configurable settings

## Key Features

- **GST Compliance**: Automatic CGST/SGST/IGST calculation
- **Multi-unit Support**: Handle different units and conversions
- **Credit Management**: Track customer dues and payments
- **Mobile Responsive**: Works on phones and tablets
- **Thermal Printing**: Receipt format optimized for thermal printers
- **Real-time Updates**: Live data with SWR caching

## Usage Tips

1. **First Setup**: Create items and customers before making sales
2. **GST Configuration**: Set correct state codes for proper tax calculation
3. **Stock Management**: Use quick stock addition for inventory updates
4. **Credit Sales**: Monitor outstanding amounts in reports
5. **Daily Closing**: Check day book for daily transaction summary

## Troubleshooting

- **Database Errors**: Ensure all migration scripts are executed
- **Environment Issues**: Verify Supabase URL and keys are correct
- **Permission Errors**: Check RLS policies are properly set
- **Missing Data**: Ensure organization is created and selected

## Production Deployment

1. Build the application: `pnpm build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Set environment variables in production
4. Test all features with production database

## Support

For issues or questions, check the code comments and component documentation.