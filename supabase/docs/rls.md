attendee_events

Disable RLS

Create policy

SELECT


attendee_events_auth_select_own
Applied to: authenticatedrole
Applies to anonymous users

attendees

Disable RLS

Create policy

INSERT


Allow anon users to create attendee records
Applied to: anonrole

ALL


Allow authenticated users to manage attendees for their registr
Applied to: authenticatedrole
Applies to anonymous users

ALL


Allow service role full access to attendees
Applied to: service_rolerole

DELETE


attendees_auth_delete_own
Applied to: authenticatedrole
Applies to anonymous users

INSERT


attendees_auth_insert_own
Applied to: authenticatedrole
Applies to anonymous users

SELECT


attendees_auth_select_own
Applied to: authenticatedrole
Applies to anonymous users

UPDATE


attendees_auth_update_own
Applied to: authenticatedrole
Applies to anonymous users

connected_account_payments

Disable RLS

Create policy

Note:
Row Level Security is enabled, but no policies exist. No data will be selectable via Supabase APIs.
No policies created yet

contacts

Disable RLS

Create policy

INSERT


Allow anon users to create contact records
Applied to: anonrole

ALL


Allow authenticated users to manage their own contacts
Applied to: authenticatedrole
Applies to anonymous users

ALL


Allow service role full access to contacts
Applied to: service_rolerole

INSERT


Anonymous users can create contacts
Applied to: anonrole

INSERT


contacts_anon_insert
Applied to: anonrole

INSERT


contacts_auth_insert_own
Applied to: authenticatedrole
Applies to anonymous users

SELECT


contacts_auth_select_own
Applied to: authenticatedrole
Applies to anonymous users

UPDATE


contacts_auth_update_own
Applied to: authenticatedrole
Applies to anonymous users

SELECT


Users can view own contacts
Applied to: publicrole
Applies to anonymous users

customers

Disable RLS

Create policy

INSERT


Allow anon users to create customer records
Applied to: anonrole

ALL


Allow authenticated users to manage their own customer data
Applied to: authenticatedrole
Applies to anonymous users

ALL


Allow service role full access to customers
Applied to: service_rolerole

INSERT


customers_auth_insert_own
Applied to: authenticatedrole
Applies to anonymous users

SELECT


customers_auth_select_own
Applied to: authenticatedrole
Applies to anonymous users

UPDATE


customers_auth_update_own
Applied to: authenticatedrole
Applies to anonymous users

display_scopes

Enable RLS

Create policy

Warning:
Row Level Security is disabled. Your table is publicly readable and writable.
No policies created yet

eligibility_criteria

Enable RLS

Create policy

Warning:
Row Level Security is disabled. Your table is publicly readable and writable.
No policies created yet

event_tickets

Disable RLS

Create policy

SELECT


Enable read access for all users
Applied to: publicrole
Applies to anonymous users

events

Disable RLS

Create policy

SELECT


events_anon_select_published
Applied to: anonrole

SELECT


events_auth_select
Applied to: authenticatedrole
Applies to anonymous users

SELECT


events_public_select
Applied to: publicrole
Applies to anonymous users

functions

Disable RLS

Create policy

SELECT


functions_public_select
Applied to: publicrole
Applies to anonymous users

grand_lodges

Disable RLS

Create policy

SELECT


grand_lodges_public_select
Applied to: publicrole
Applies to anonymous users

locations

Disable RLS

Create policy

UPDATE


Allow authenticated users to update venue information
Applied to: publicrole
Applies to anonymous users

SELECT


Allow public read access to venue information
Applied to: publicrole
Applies to anonymous users

ALL


Allow service role full access to locations
Applied to: publicrole
Applies to anonymous users

INSERT


locations_auth_insert
Applied to: authenticatedrole
Applies to anonymous users

UPDATE


locations_auth_update
Applied to: authenticatedrole
Applies to anonymous users

SELECT


locations_public_select
Applied to: anon, authenticatedroles
Applies to anonymous users

lodge_creation_rate_limit

Enable RLS

Create policy

Warning:
Row Level Security is disabled. Your table is publicly readable and writable.
No policies created yet

lodges

Disable RLS

Create policy

INSERT


lodges_anon_insert
Applied to: anon, authenticatedroles
Applies to anonymous users

INSERT


lodges_insert
Applied to: anon, authenticatedroles
Applies to anonymous users

INSERT


lodges_public_insert_secure
Applied to: publicrole
Applies to anonymous users

SELECT


lodges_public_select
Applied to: publicrole
Applies to anonymous users

masonic_profiles

Disable RLS

Create policy

INSERT


Allow anon users to create masonic profile records
Applied to: anonrole

SELECT


Allow authenticated users to read masonic profiles
Applied to: authenticatedrole
Applies to anonymous users

ALL


Allow service role full access to masonic profiles
Applied to: service_rolerole

INSERT


masonic_profiles_auth_insert_own
Applied to: authenticatedrole
Applies to anonymous users

SELECT


masonic_profiles_auth_select_own
Applied to: authenticatedrole
Applies to anonymous users

UPDATE


masonic_profiles_auth_update_own
Applied to: authenticatedrole
Applies to anonymous users

memberships

Disable RLS

Create policy

DELETE


memberships_auth_delete_own
Applied to: authenticatedrole
Applies to anonymous users

INSERT


memberships_auth_insert_own
Applied to: authenticatedrole
Applies to anonymous users

SELECT


memberships_auth_select_own
Applied to: authenticatedrole
Applies to anonymous users

UPDATE


memberships_auth_update_own
Applied to: authenticatedrole
Applies to anonymous users

organisation_payouts

Enable RLS

Create policy

Warning:
Row Level Security is disabled. Your table is publicly readable and writable.
No policies created yet

organisation_users

Disable RLS

Create policy

ALL


Organisation admins can manage memberships
Applied to: publicrole
Applies to anonymous users

SELECT


Users can view their own organisation memberships
Applied to: publicrole
Applies to anonymous users

organisations

Disable RLS

Create policy

INSERT


organisations_anon_insert
Applied to: anon, authenticatedroles
Applies to anonymous users

INSERT


organisations_insert
Applied to: anon, authenticatedroles
Applies to anonymous users

INSERT


organisations_public_insert_secure
Applied to: publicrole
Applies to anonymous users

SELECT


organisations_public_select
Applied to: publicrole
Applies to anonymous users

packages

Disable RLS

Create policy

SELECT


packages_public_select
Applied to: publicrole
Applies to anonymous users

SELECT


Public can view all columns in packages
Applied to: publicrole
Applies to anonymous users

platform_transfers

Enable RLS

Create policy

Warning:
Row Level Security is disabled. Your table is publicly readable and writable.
No policies created yet

raw_registrations

Disable RLS

Create policy

INSERT


Allow anon users to insert raw registration data
Applied to: anonrole

INSERT


Allow anonymous inserts to raw_registrations
Applied to: anon, authenticatedroles
Applies to anonymous users

SELECT


Allow authenticated reads from raw_registrations
Applied to: authenticatedrole
Applies to anonymous users

INSERT


Allow authenticated users to insert raw registration data
Applied to: authenticatedrole
Applies to anonymous users

SELECT


Allow authenticated users to read their own raw registration da
Applied to: authenticatedrole
Applies to anonymous users

ALL


Allow RPC function access to raw registrations
Applied to: publicrole
Applies to anonymous users

ALL


Allow service role full access to raw registrations
Applied to: service_rolerole

registrations

Disable RLS

Create policy

INSERT


Allow anon users to create registration records
Applied to: anonrole

ALL


Allow authenticated users to manage their own registrations
Applied to: authenticatedrole
Applies to anonymous users

ALL


Allow service role full access to registrations
Applied to: service_rolerole

INSERT


Anonymous users can create own registrations
Applied to: anonrole

INSERT


registrations_anon_insert
Applied to: anonrole

INSERT


registrations_auth_insert
Applied to: authenticatedrole
Applies to anonymous users

INSERT


registrations_auth_insert_own
Applied to: authenticatedrole
Applies to anonymous users

SELECT


registrations_auth_select_organizer
Applied to: authenticatedrole
Applies to anonymous users

SELECT


registrations_auth_select_own
Applied to: authenticatedrole
Applies to anonymous users

UPDATE


registrations_auth_update_own
Applied to: authenticatedrole
Applies to anonymous users

UPDATE


registrations_auth_update_pending
Applied to: authenticatedrole
Applies to anonymous users

INSERT


registrations_insert_own
Applied to: authenticatedrole
Applies to anonymous users

SELECT


registrations_select_own
Applied to: authenticatedrole
Applies to anonymous users

UPDATE


registrations_update_own
Applied to: authenticatedrole
Applies to anonymous users

UPDATE


Users can update own registrations
Applied to: publicrole
Applies to anonymous users

SELECT


Users can view own registrations
Applied to: publicrole
Applies to anonymous users

tickets

Disable RLS

Create policy

INSERT


Allow anon users to create ticket records
Applied to: anonrole

ALL


Allow authenticated users to manage tickets for their registrat
Applied to: authenticatedrole
Applies to anonymous users

ALL


Allow service role full access to tickets
Applied to: service_rolerole

INSERT


tickets_auth_insert_own
Applied to: authenticatedrole
Applies to anonymous users

SELECT


tickets_auth_select_organizer
Applied to: authenticatedrole
Applies to anonymous users

SELECT


tickets_auth_select_own
Applied to: authenticatedrole
Applies to anonymous users

UPDATE


tickets_auth_update_own
Applied to: authenticatedrole
Applies to anonymous users

INSERT


Users can create tickets for own registrations
Applied to: anon, authenticatedroles
Applies to anonymous users

SELECT


Users can view own tickets
Applied to: publicrole
Applies to anonymous users

user_roles

Disable RLS

Create policy

SELECT


user_roles_auth_select_own
Applied to: authenticatedrole
Applies to anonymous users

webhook_logs

Disable RLS

Create policy

INSERT


Allow authenticated users to insert webhook logs
Applied to: anon, authenticatedroles
Applies to anonymous users

SELECT


Allow authenticated users to view webhook logs
Applied to: authenticatedrole
Applies to anonymous users

ALL


Service role can manage webhook logs
Applied to: service_rolerole