Customers
Description
Click to edit.

Cancel

Save
Column
id
Required
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select id
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('id')
Column
userId
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select userId
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('userId')
Column
contactId
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select contactId
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('contactId')
Column
organisationId
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select organisationId
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('organisationId')
Column
firstName
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select firstName
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('firstName')
Column
lastName
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select lastName
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('lastName')
Column
businessName
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select businessName
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('businessName')
Column
email
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select email
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('email')
Column
phone
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select phone
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('phone')
Column
billingFirstName
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select billingFirstName
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('billingFirstName')
Column
billingLastName
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select billingLastName
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('billingLastName')
Column
billingOrganisationName
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select billingOrganisationName
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('billingOrganisationName')
Column
billingEmail
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select billingEmail
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('billingEmail')
Column
billingPhone
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select billingPhone
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('billingPhone')
Column
billingStreetAddress
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select billingStreetAddress
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('billingStreetAddress')
Column
billingCity
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select billingCity
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('billingCity')
Column
billingState
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select billingState
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('billingState')
Column
billingPostalCode
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select billingPostalCode
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('billingPostalCode')
Column
billingCountry
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select billingCountry
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('billingCountry')
Column
addressLine1
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select addressLine1
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('addressLine1')
Column
addressLine2
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select addressLine2
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('addressLine2')
Column
city
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select city
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('city')
Column
state
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select state
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('state')
Column
postalCode
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select postalCode
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('postalCode')
Column
country
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select country
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('country')
Column
stripeCustomerId
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select stripeCustomerId
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('stripeCustomerId')
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
let { data: Customers, error } = await supabase
  .from('Customers')
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
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('updatedAt')
Column
person_id
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select person_id
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('person_id')
Read rows
To read rows in Customers, use the select method.

Learn more

Read all rows
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('*')
Read specific columns
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('some_column,other_column')
Read referenced tables
let { data: Customers, error } = await supabase
  .from('Customers')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination
let { data: Customers, error } = await supabase
  .from('Customers')
  .select('*')
  .range(0, 9)
Filtering
Supabase provides a wide range of filters.

Learn more

With filtering
let { data: Customers, error } = await supabase
  .from('Customers')
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
  .from('Customers')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows
const { data, error } = await supabase
  .from('Customers')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows
const { data, error } = await supabase
  .from('Customers')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Learn more

Update matching rows
const { data, error } = await supabase
  .from('Customers')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Learn more

Delete matching rows
const { error } = await supabase
  .from('Customers')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Learn more

Subscribe to all events
const Customers = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Customers' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts
const Customers = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'Customers' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates
const Customers = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'Customers' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes
const Customers = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'Customers' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows
const Customers = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Customers', filter: 'column_name=eq.someValue' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()