Registrations
Description
Click to edit.

Cancel

Save
Column
registrationId
Required
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select registrationId
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('registrationId')
Column
customerId
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select customerId
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('customerId')
Column
eventId
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select eventId
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('eventId')
Column
registrationDate
Optional
Type
string
Format
timestamp with time zone
Description
Click to edit.

Cancel

Save
Select registrationDate
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('registrationDate')
Column
status
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select status
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('status')
Column
totalAmountPaid
Optional
Type
number
Format
numeric
Description
Click to edit.

Cancel

Save
Select totalAmountPaid
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('totalAmountPaid')
Column
totalPricePaid
Optional
Type
number
Format
numeric
Description
Click to edit.

Cancel

Save
Select totalPricePaid
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('totalPricePaid')
Column
paymentStatus
Optional
Type
string
Format
public.payment_status
Description
Current payment status of the registration

Cancel

Save
Select paymentStatus
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('paymentStatus')
Column
agreeToTerms
Optional
Type
boolean
Format
boolean
Description
Click to edit.

Cancel

Save
Select agreeToTerms
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('agreeToTerms')
Column
stripePaymentIntentId
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select stripePaymentIntentId
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('stripePaymentIntentId')
Column
primaryAttendeeId
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select primaryAttendeeId
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('primaryAttendeeId')
Column
registrationType
Optional
Type
string
Format
public.registration_type
Description
Type of registration: Individuals (single person), Groups (multiple people), Officials (event staff/organizers)

Cancel

Save
Select registrationType
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('registrationType')
Column
createdAt
Optional
Type
string
Format
timestamp with time zone
Description
Click to edit.

Cancel

Save
Select createdAt
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('createdAt')
Column
updatedAt
Optional
Type
string
Format
timestamp with time zone
Description
Click to edit.

Cancel

Save
Select updatedAt
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('updatedAt')
Column
registrationData
Optional
Type
Format
jsonb[]
Description
Click to edit.

Cancel

Save
Select registrationData
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('registrationData')
Read rows
To read rows in Registrations, use the select method.

Learn more

Read all rows
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('*')
Read specific columns
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('some_column,other_column')
Read referenced tables
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select('*')
  .range(0, 9)
Filtering
Supabase provides a wide range of filters.

Learn more

With filtering
let { data: Registrations, error } = await supabase
  .from('Registrations')
  .select("*")

  // Filters
  .eq('column', 'Equal to')
  .gt('column', 'Greater than')
  .lt('column', 'Less than')
  .gte('column', 'Greater than or equal to')
  .lte('column', 'Less than or equal to')
  .like('column', '%CaseSensitive%')
  .ilike('column', '%CaseInsensitive%')
  .is('column', null)
  .in('column', ['Array', 'Values'])
  .neq('column', 'Not equal to')

  // Arrays
  .contains('array_column', ['array', 'contains'])
  .containedBy('array_column', ['contained', 'by'])

  // Logical operators
  .not('column', 'like', 'Negate filter')
  .or('some_column.eq.Some value, other_column.eq.Other value')
Insert rows
insert lets you insert into your tables. You can also insert in bulk and do UPSERT.

insert will also return the replaced values for UPSERT.

Learn more

Insert a row
const { data, error } = await supabase
  .from('Registrations')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows
const { data, error } = await supabase
  .from('Registrations')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows
const { data, error } = await supabase
  .from('Registrations')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Learn more

Update matching rows
const { data, error } = await supabase
  .from('Registrations')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Learn more

Delete matching rows
const { error } = await supabase
  .from('Registrations')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Learn more

Subscribe to all events
const Registrations = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Registrations' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts
const Registrations = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'Registrations' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates
const Registrations = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'Registrations' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes
const Registrations = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'Registrations' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows
const Registrations = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Registrations', filter: 'column_name=eq.someValue' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()