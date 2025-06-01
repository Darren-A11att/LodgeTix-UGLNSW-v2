# Organiser Portal Authentication

The organiser portal uses a controlled authentication system where users must be manually granted access. Public sign-ups are disabled to ensure only authorized organisation administrators can access the portal.

## Authentication Architecture

### Database Structure

1. **auth.users** - Supabase authentication users
2. **contacts** - Contact records with optional `auth_user_id` linking to auth users
3. **user_roles** - Defines user roles (e.g., 'organiser_admin')
4. **organisation_users** - Links users to organisations with specific roles
5. **organisations** - Organisation records

### Access Control Flow

```
User Login → Check auth.users → Check organisation_users → Grant/Deny Access
```

## Setting Up an Organiser User

### Prerequisites

1. The contact must exist in the `contacts` table
2. The organisation must exist in the `organisations` table
3. You need the SUPABASE_SERVICE_ROLE_KEY environment variable

### Method 1: Using the Setup Script

1. Update the contact ID, organisation ID, and function ID in `scripts/setup-organiser-user.ts`:

```typescript
const CONTACT_ID = 'your-contact-uuid'
const ORGANISATION_ID = 'your-organisation-uuid'
const FUNCTION_ID = 'your-function-uuid' // Optional
```

2. Run the setup script:

```bash
npm run setup:organiser-user
```

3. The script will:
   - Create an auth user for the contact
   - Link the contact to the auth user
   - Add the 'organiser_admin' role
   - Link the user to the organisation as an admin
   - Display the temporary password

### Method 2: Manual Database Setup

1. Run the migration to create the organisation_users table:

```bash
supabase migration up
```

2. Create an auth user using Supabase dashboard or API

3. Update the contact with the auth_user_id:

```sql
UPDATE contacts 
SET auth_user_id = 'auth-user-uuid'
WHERE contact_id = 'contact-uuid';
```

4. Add user role:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('auth-user-uuid', 'organiser_admin');
```

5. Link user to organisation:

```sql
INSERT INTO organisation_users (user_id, organisation_id, role)
VALUES ('auth-user-uuid', 'organisation-uuid', 'admin');
```

## Authentication Process

1. User visits `/login`
2. Enters email and password
3. System checks if user exists in `organisation_users`
4. If authorized, redirects to `/organiser`
5. If not authorized, shows error and redirects to `/organiser/unauthorized`

## Security Features

- No public sign-ups allowed
- Manual user creation only
- Organisation-based access control
- Role-based permissions (admin, member)
- All actions verify organisation membership

## Managing Users

### Adding a New Organiser

1. Create or find the contact in the database
2. Run the setup script with their contact ID
3. Send them their login credentials securely
4. Have them change password on first login

### Removing Access

```sql
-- Remove organisation access
DELETE FROM organisation_users 
WHERE user_id = 'user-uuid' AND organisation_id = 'org-uuid';

-- Or disable the auth user entirely
UPDATE auth.users 
SET banned_until = '2099-12-31'
WHERE id = 'user-uuid';
```

### Changing Roles

```sql
UPDATE organisation_users 
SET role = 'member' -- or 'admin'
WHERE user_id = 'user-uuid' AND organisation_id = 'org-uuid';
```

## Troubleshooting

### User Can't Login

1. Check if auth user exists
2. Verify contact has auth_user_id set
3. Check organisation_users has entry
4. Verify user role is correct

### User Sees Unauthorized Page

- User is not in organisation_users table
- User's role doesn't have sufficient permissions
- Organisation relationship is missing

### Password Reset

Use Supabase Auth Admin API or dashboard to reset passwords manually.

## Future Enhancements

- [ ] Password reset flow
- [ ] Two-factor authentication
- [ ] Session management
- [ ] Audit logging
- [ ] Multiple organisation support per user