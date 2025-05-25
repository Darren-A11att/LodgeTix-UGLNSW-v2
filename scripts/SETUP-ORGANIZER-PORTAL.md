# Organizer Portal Setup Guide

Complete setup process for Darren Allatt as administrator of United Grand Lodge of NSW & ACT.

## Overview

You have:
- ✅ **Organizer Portal Code** - All v1 features implemented and deployed
- ✅ **Organization Record** - United Grand Lodge of NSW & ACT (ID: `3e893fa6-2cc2-448c-be9c-e3858cc90e11`)
- ❌ **Database Schema** - Need to create organizer tables
- ❌ **User Account** - Need to create and link your account

## Setup Steps

### 1. 🗄️ Create Database Schema

Run the migration to create organizer portal tables:

**File**: `supabase/migrations/20250526_create_organizer_portal_schema.sql`

This creates:
- `organizers` table - user profiles
- `user_roles` table - organization permissions  
- RPC functions for data access
- RLS policies for security
- Performance indexes

**How to run**:
1. Copy the entire migration file content
2. Paste in Supabase SQL Editor
3. Execute the migration

### 2. 👤 Create Your Auth Account

Create your Supabase authentication account:

**Option A: Through the App**
1. Visit: `your-app-url/organizer/login`
2. Click "Sign Up"
3. Use email: `darren.allatt@gmail.com`
4. Set a secure password
5. Verify your email

**Option B: Supabase Dashboard**
1. Go to your Supabase project
2. Authentication → Users
3. Add User: `darren.allatt@gmail.com`

### 3. 🔍 Get Your User ID

Find your Supabase user ID:

```sql
SELECT 
    id as user_id,
    email,
    created_at
FROM auth.users
WHERE email = 'darren.allatt@gmail.com';
```

Copy the `user_id` value (UUID format).

### 4. 🔗 Link to Organization

**File**: `scripts/link-darren-to-uglnsw.sql`

1. Edit the script and replace:
   ```sql
   darren_user_id UUID := 'YOUR_USER_ID_HERE';
   ```
   With your actual user ID from step 3.

2. Run the complete script in Supabase SQL Editor

This will:
- Create your organizer profile
- Link you to United Grand Lodge of NSW & ACT
- Assign admin role with all permissions
- Verify the setup

### 5. ✅ Test Access

1. **Login**: Go to `/organizer/login` and sign in
2. **Dashboard**: You should see the enhanced dashboard
3. **Features**: Test all v1 functionality:
   - View events (currently empty)
   - Access registration management
   - Export capabilities
   - Financial summaries

## What You'll Have After Setup

### 🏛️ Organization Profile
- **Name**: United Grand Lodge of NSW & ACT
- **ID**: `3e893fa6-2cc2-448c-be9c-e3858cc90e11`
- **Contact**: admin@uglnsw.org.au
- **Website**: https://www.uglnsw.org.au

### 👨‍💼 Your Organizer Profile
- **Name**: Darren Allatt
- **Email**: darren.allatt@gmail.com
- **Position**: Portal Administrator
- **Role**: Admin

### 🔐 Admin Permissions
- ✅ **create_events** - Create and manage events
- ✅ **manage_registrations** - View and manage registrations
- ✅ **view_reports** - Access analytics and reports
- ✅ **export_data** - Export CSV/PDF reports
- ✅ **manage_users** - Manage other organizers

### 🚀 Available Features
- **Dashboard**: Real-time analytics and KPIs
- **Events Management**: List and manage events
- **Registration Tracking**: Detailed attendee management
- **Export Tools**: CSV, PDF, and print-friendly reports
- **Financial Analytics**: Revenue tracking and payment success rates
- **Attendee Details**: Comprehensive attendee information modal

## Troubleshooting

### "Table doesn't exist" errors
- ❌ Migration not run
- ✅ Run `20250526_create_organizer_portal_schema.sql` first

### "User not found" errors  
- ❌ Auth account not created
- ✅ Create account via app or Supabase dashboard

### "Organization not found" errors
- ❌ Wrong organization ID
- ✅ Verify ID: `3e893fa6-2cc2-448c-be9c-e3858cc90e11`

### Can't access organizer portal
- ❌ User not linked to organization
- ✅ Run the linking script with correct user_id

### Permission denied errors
- ❌ RLS policies not working
- ✅ Check migration ran completely
- ✅ Verify user_id matches in organizers table

## Next Steps

After successful setup:

1. **Create Test Events** (v4 feature - coming soon)
2. **Add More Organizers** (use the seed scripts as templates)
3. **Customize Organization Details** (update in database)
4. **Test Registration Flow** (with real event data)

## File Reference

```
scripts/
├── 20250526_create_organizer_portal_schema.sql  # Database migration
├── link-darren-to-uglnsw.sql                    # Link user to org
├── get-user-id.sql                              # Helper queries
└── SETUP-ORGANIZER-PORTAL.md                    # This guide
```

---

**Need Help?** 
- Check the verification queries in each script
- Review the RLS policies in the migration
- Ensure all prerequisites are met before each step