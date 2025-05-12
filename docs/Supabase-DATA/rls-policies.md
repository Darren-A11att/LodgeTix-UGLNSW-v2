# Supabase Row Level Security (RLS) Policies Documentation

This document details the Row Level Security (RLS) policies implemented in the LodgeTix-UGLNSW-v2 Supabase database. RLS policies are essential for data security, controlling which users can access, modify, or delete specific rows in database tables.

## RLS Overview

Row Level Security (RLS) in PostgreSQL allows database administrators to define access policies that restrict which rows users can view, modify, or delete on a per-table basis. Supabase leverages this feature to implement fine-grained security controls that complement the authentication system.

## Identified RLS Policies

Based on the available schema information, the following RLS policies have been identified:

### grand_lodges Table

RLS is enabled on the `grand_lodges` table with the following policies:

1. **Authenticated users can read grand_lodges**
   - **Operation:** SELECT
   - **Expression:** `auth.role() = 'authenticated'`
   - **Description:** Allows any authenticated user to read grand lodge records
   - **Implementation:**
     ```sql
     CREATE POLICY "Authenticated users can read grand_lodges" 
       ON public.grand_lodges FOR SELECT 
       USING (auth.role() = 'authenticated');
     ```

### lodges Table

RLS is enabled on the `lodges` table with the following policies:

1. **Authenticated users can read lodges**
   - **Operation:** SELECT
   - **Expression:** `auth.role() = 'authenticated'`
   - **Description:** Allows any authenticated user to read lodge records
   - **Implementation:**
     ```sql
     CREATE POLICY "Authenticated users can read lodges" 
       ON public.lodges FOR SELECT 
       USING (auth.role() = 'authenticated');
     ```

2. **Authenticated users can create lodges**
   - **Operation:** INSERT
   - **Expression:** `auth.role() = 'authenticated'`
   - **Description:** Allows any authenticated user to create new lodge records
   - **Implementation:**
     ```sql
     CREATE POLICY "Authenticated users can create lodges" 
       ON public.lodges FOR INSERT 
       WITH CHECK (auth.role() = 'authenticated');
     ```

## Inferred/Potential RLS Policies

While not explicitly defined in the available schema information, the following tables likely have or should have RLS policies based on the application's data model and security requirements:

### Events Table

1. **Authenticated users can read events**
   - **Operation:** SELECT
   - **Expression:** `auth.role() = 'authenticated'`
   - **Description:** Allows any authenticated user to read event records

2. **Event organizers can manage their events**
   - **Operation:** INSERT, UPDATE, DELETE
   - **Expression:** `auth.uid() IN (SELECT user_id FROM users_organizations WHERE organization_id = Events.organiserorganisationid AND role = 'organizer')`
   - **Description:** Allows event organizers to manage events for their organizations

### Registrations Table

1. **Users can view their own registrations**
   - **Operation:** SELECT
   - **Expression:** `auth.uid() = Customers.userId AND Customers.id = Registrations.customerId`
   - **Description:** Allows users to view only their own registrations

2. **Event organizers can view registrations for their events**
   - **Operation:** SELECT
   - **Expression:** `auth.uid() IN (SELECT user_id FROM users_organizations WHERE organization_id = Events.organiserorganisationid AND role = 'organizer') AND Events.id = Registrations.eventId`
   - **Description:** Allows event organizers to view registrations for events they manage

### Attendees Table

1. **Users can view their own attendee records**
   - **Operation:** SELECT
   - **Expression:** `auth.uid() = people.auth_user_id AND people.person_id = Attendees.person_id`
   - **Description:** Allows users to view only their own attendee records

2. **Registration owners can view attendees in their registrations**
   - **Operation:** SELECT
   - **Expression:** `auth.uid() = Customers.userId AND Customers.id = Registrations.customerId AND Registrations.registrationId = Attendees.registrationid`
   - **Description:** Allows registration owners to view attendees in their registrations

### user_roles Table

1. **Users can read their own roles**
   - **Operation:** SELECT
   - **Expression:** `auth.uid() = user_roles.user_id`
   - **Description:** Allows users to view only their own role assignments

2. **Administrators can manage roles**
   - **Operation:** SELECT, INSERT, UPDATE, DELETE
   - **Expression:** `auth.role() = 'admin'`
   - **Description:** Allows administrators to manage all role assignments

## RLS Best Practices and Implementation Guidelines

### General Guidelines

1. **Enable RLS on All Tables**
   - RLS should be enabled on all tables containing sensitive data
   - Example: `ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;`

2. **Default Deny**
   - By default, with RLS enabled and no policies, all operations are denied
   - Create explicit policies for each allowed operation

3. **Use Context Variables**
   - Leverage Supabase auth context variables like `auth.uid()` and `auth.role()`
   - Example: `USING (auth.uid() = user_id)`

4. **Test Thoroughly**
   - Test policies from different user contexts
   - Ensure policies don't interfere with each other

### Policy Creation Syntax

```sql
CREATE POLICY policy_name
ON table_name
FOR operation
TO role
USING (using_expression)
WITH CHECK (check_expression);
```

Where:
- `operation` is SELECT, INSERT, UPDATE, DELETE, or ALL
- `role` is optional and defaults to PUBLIC
- `USING` expression controls row visibility
- `WITH CHECK` expression controls row insertability/updateability

### Common Policy Patterns

1. **Owner-Based Access**
   ```sql
   CREATE POLICY "Users can view own records"
     ON table_name FOR SELECT
     USING (auth.uid() = user_id);
   ```

2. **Role-Based Access**
   ```sql
   CREATE POLICY "Admins can do anything"
     ON table_name FOR ALL
     USING (auth.role() = 'admin');
   ```

3. **Organization-Based Access**
   ```sql
   CREATE POLICY "Users can view org data"
     ON table_name FOR SELECT
     USING (
       auth.uid() IN (
         SELECT user_id FROM organization_members
         WHERE organization_id = table_name.org_id
       )
     );
   ```

4. **Public/Private Records**
   ```sql
   CREATE POLICY "Anyone can view public records"
     ON table_name FOR SELECT
     USING (is_public = true);
   ```

## Security Considerations

1. **Auth Bypass Protection**
   - Always test that unauthenticated users cannot access protected data
   - Regularly audit RLS policies to ensure they're working as expected

2. **Service Roles**
   - Be cautious with service role access which bypasses RLS
   - Limit service role usage to necessary server-side operations

3. **API Security**
   - Remember that RLS only protects direct database access
   - Secure all API endpoints with appropriate authentication

4. **Data Leakage Prevention**
   - Be careful about data leakage through joins or subqueries
   - Consider using views with appropriate RLS policies

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)