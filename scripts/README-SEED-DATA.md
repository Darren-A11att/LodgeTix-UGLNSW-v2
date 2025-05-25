# Organizer Portal Seed Data Setup

This directory contains SQL scripts to set up seed data for the organizer portal, specifically for **Darren Allatt** as the primary administrator for **United Grand Lodge of NSW & ACT**.

## Quick Setup Process

### 1. Create Your Supabase Auth Account

First, you need to create an authenticated user account in Supabase:

**Option A: Through the App (Recommended)**
1. Go to your app's organizer login page: `/organizer/login`
2. Sign up with email: `darren.allatt@gmail.com`
3. Complete the email verification process

**Option B: Through Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user" and create account with `darren.allatt@gmail.com`

### 2. Get Your User ID

Run this query in the Supabase SQL Editor to get your user ID:

```sql
-- Copy from scripts/get-user-id.sql
SELECT 
    id as user_id,
    email,
    created_at
FROM auth.users
WHERE email = 'darren.allatt@gmail.com';
```

Copy the `user_id` value (it will look like: `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`)

### 3. Update the Seed Script

Edit `scripts/seed-primary-organizer.sql` and replace this line:

```sql
darren_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; -- Replace with actual
```

With your actual user ID:

```sql
darren_user_id UUID := 'YOUR_ACTUAL_USER_ID_HERE';
```

### 4. Run the Seed Script

Execute the seed script in Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of scripts/seed-primary-organizer.sql
```

This will create:
- ✅ **United Grand Lodge of NSW & ACT** organization
- ✅ **Darren Allatt** as Portal Administrator with full admin permissions
- ✅ Proper role assignments and permissions

### 5. Verify Setup

The script includes verification queries that will show:
- Your organizer details
- Organization information
- Role and permissions assigned

## What Gets Created

### Organization: United Grand Lodge of NSW & ACT
- **Name**: United Grand Lodge of NSW & ACT
- **Email**: admin@uglnsw.org.au
- **Phone**: +61 2 9264 8404
- **Website**: https://www.uglnsw.org.au
- **Address**: 279-281 Castlereagh Street, Sydney, NSW 2000
- **Country**: Australia

### Organizer: Darren Allatt
- **Name**: Darren Allatt
- **Email**: darren.allatt@gmail.com
- **Position**: Portal Administrator
- **Role**: Admin
- **Permissions**: 
  - create_events
  - manage_registrations
  - view_reports
  - export_data
  - manage_users

## Testing the Portal

After running the seed data, you can:

1. **Login**: Go to `/organizer/login` and sign in with `darren.allatt@gmail.com`
2. **Dashboard**: View the organizer dashboard with your organization data
3. **Events**: Access the events listing (currently empty - ready for v4 event creation)
4. **Test Features**: All v1 features are available:
   - View events and registrations
   - Export functionality
   - Financial summaries
   - Print-friendly reports

## Additional Test Data

The `seed-organizer-users.sql` file contains additional test organizations and users if you need more comprehensive test data:

- **Grand Lodge of Victoria** with Michael Brown
- **Lodge Test Organization** with Sarah Wilson

## File Structure

```
scripts/
├── seed-primary-organizer.sql      # Main script for Darren's account
├── get-user-id.sql                 # Helper to find your Supabase user ID
├── seed-organizer-users.sql        # Full test data with multiple orgs
└── README-SEED-DATA.md             # This file
```

## Troubleshooting

### "Organization not found" error
- Make sure the organization was created successfully
- Check for typos in the organization name

### "User ID not found" error
- Verify you're using the correct user_id from `auth.users`
- Ensure the user was created in Supabase Auth first

### Permission denied errors
- Make sure RLS policies are properly configured
- Verify the user has been assigned to the correct organization

### Can't access organizer portal
- Confirm the user_id matches between `auth.users` and `organizers` table
- Check that `is_active = true` for both organizer and user_role records

## Next Steps

Once seed data is set up:

1. **Test the Portal**: Login and explore all v1 features
2. **Create Events**: Ready for v4 event creation functionality
3. **Add More Organizers**: Use the full seed script to add additional test users
4. **Production Data**: Adapt these scripts for production organization setup

---

**Note**: This seed data is designed for development and testing. For production use, follow proper user registration flows and data validation procedures.