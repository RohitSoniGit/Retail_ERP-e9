# Ronak Jewellers ERP Setup

This ERP system is pre-configured for **Ronak Jewellers**.

## Quick Setup

### 1. Database Setup
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the following SQL files in order:
   - **First**: Copy and paste `master_setup.sql` and run it (creates all tables and policies)
   - **Then**: Copy and paste `scripts/setup-ronak-jewellers.sql` and run it (creates Ronak Jewellers organization)

### 2. Create Admin User
1. Go to your Supabase dashboard → Authentication → Users
2. Click "Add user"
3. Create user with:
   - Email: `admin@ronakjewellers.com`
   - Password: `ronak@123`
   - Email Confirm: Yes (check the box to skip email verification)

### 3. Start the Application
```bash
npm run dev
```

### 4. Login
1. Go to `http://localhost:3000/login`
2. Use the credentials:
   - Email: `admin@ronakjewellers.com`
   - Password: `ronak@123`
3. The system will load with Ronak Jewellers organization

## Default Configuration

**Organization Details:**
- Name: Ronak Jewellers
- GST Number: 24ABCDE1234F1Z5
- Address: 123 Jewellery Market, Surat, Gujarat 395003
- Phone: +91 9876543210
- State: Gujarat (Code: 24)

**What's Included:**
- Organization setup only
- No sample data - you can add your own items, customers, etc.

## Troubleshooting

**If you see "No organizations found" error:**
1. Make sure you ran both SQL scripts in the correct order
2. Check that the organization was created in Supabase → Table Editor → organizations
3. Refresh the page

**If login fails:**
1. Make sure you created the admin user in Supabase Authentication
2. Check that email confirmation is enabled for the user
3. Try the exact credentials: `admin@ronakjewellers.com` / `ronak@123`

## Customization

To customize for your business:
1. Login to the system
2. Go to Settings → Organization
3. Update business details
4. Add your own items, customers, and categories
5. Update the admin user email/password in Authentication