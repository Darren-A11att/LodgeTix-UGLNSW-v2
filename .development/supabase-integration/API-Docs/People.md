people
Description
Consolidated table for all unique individuals and organisations (marked by is_organisation flag). Replaces Contacts, Masons, Guests.

Cancel

Save
Column
person_id
Required
Type
string
Format
uuid
Description
Unique identifier for the person or organisation entity.

Cancel

Save
Select person_id
let { data: people, error } = await supabase
  .from('people')
  .select('person_id')
Column
auth_user_id
Optional
Type
string
Format
uuid
Description
Link to the Supabase authenticated user, if applicable.

Cancel

Save
Select auth_user_id
let { data: people, error } = await supabase
  .from('people')
  .select('auth_user_id')
Column
first_name
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select first_name
let { data: people, error } = await supabase
  .from('people')
  .select('first_name')
Column
last_name
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select last_name
let { data: people, error } = await supabase
  .from('people')
  .select('last_name')
Column
title
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select title
let { data: people, error } = await supabase
  .from('people')
  .select('title')
Column
suffix
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select suffix
let { data: people, error } = await supabase
  .from('people')
  .select('suffix')
Column
primary_email
Optional
Type
string
Format
text
Description
Primary contact email address.

Cancel

Save
Select primary_email
let { data: people, error } = await supabase
  .from('people')
  .select('primary_email')
Column
primary_phone
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select primary_phone
let { data: people, error } = await supabase
  .from('people')
  .select('primary_phone')
Column
street_address
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select street_address
let { data: people, error } = await supabase
  .from('people')
  .select('street_address')
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
let { data: people, error } = await supabase
  .from('people')
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
let { data: people, error } = await supabase
  .from('people')
  .select('state')
Column
postal_code
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select postal_code
let { data: people, error } = await supabase
  .from('people')
  .select('postal_code')
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
let { data: people, error } = await supabase
  .from('people')
  .select('country')
Column
dietary_requirements
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select dietary_requirements
let { data: people, error } = await supabase
  .from('people')
  .select('dietary_requirements')
Column
special_needs
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select special_needs
let { data: people, error } = await supabase
  .from('people')
  .select('special_needs')
Column
is_organisation
Required
Type
boolean
Format
boolean
Description
Flag indicating if this record represents an organisation rather than an individual.

Cancel

Save
Select is_organisation
let { data: people, error } = await supabase
  .from('people')
  .select('is_organisation')
Column
created_at
Required
Type
string
Format
timestamp with time zone
Description
Click to edit.

Cancel

Save
Select created_at
let { data: people, error } = await supabase
  .from('people')
  .select('created_at')
Column
updated_at
Required
Type
string
Format
timestamp with time zone
Description
Click to edit.

Cancel

Save
Select updated_at
let { data: people, error } = await supabase
  .from('people')
  .select('updated_at')
Read rows
To read rows in people, use the select method.

Learn more

Read all rows
let { data: people, error } = await supabase
  .from('people')
  .select('*')
Read specific columns
let { data: people, error } = await supabase
  .from('people')
  .select('some_column,other_column')
Read referenced tables
let { data: people, error } = await supabase
  .from('people')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination
let { data: people, error } = await supabase
  .from('people')
  .select('*')
  .range(0, 9)
Filtering
Supabase provides a wide range of filters.

Learn more

With filtering
let { data: people, error } = await supabase
  .from('people')
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
  .from('people')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows
const { data, error } = await supabase
  .from('people')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows
const { data, error } = await supabase
  .from('people')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Learn more

Update matching rows
const { data, error } = await supabase
  .from('people')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Learn more

Delete matching rows
const { error } = await supabase
  .from('people')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Learn more

Subscribe to all events
const people = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'people' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts
const people = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'people' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates
const people = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'people' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes
const people = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'people' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows
const people = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'people', filter: 'column_name=eq.someValue' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()