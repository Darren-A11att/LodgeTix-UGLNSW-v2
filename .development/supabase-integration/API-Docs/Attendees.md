Attendees
Description
Represents an individual's participation in a specific registration/event.

Cancel

Save
Column
attendeeid
Required
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select attendeeid
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('attendeeid')
Column
registrationid
Required
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select registrationid
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('registrationid')
Column
attendeetype
Required
Type
string
Format
public.attendee_type
Description
Click to edit.

Cancel

Save
Select attendeetype
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('attendeetype')
Column
eventtitle
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select eventtitle
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('eventtitle')
Column
dietaryrequirements
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select dietaryrequirements
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('dietaryrequirements')
Column
specialneeds
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select specialneeds
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('specialneeds')
Column
contactpreference
Required
Type
string
Format
public.attendee_contact_preference
Description
Click to edit.

Cancel

Save
Select contactpreference
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('contactpreference')
Column
relatedattendeeid
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select relatedattendeeid
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('relatedattendeeid')
Column
relationship
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select relationship
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('relationship')
Column
createdat
Required
Type
string
Format
timestamp with time zone
Description
Click to edit.

Cancel

Save
Select createdat
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('createdat')
Column
updatedat
Required
Type
string
Format
timestamp with time zone
Description
Click to edit.

Cancel

Save
Select updatedat
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('updatedat')
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
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('person_id')
Read rows
To read rows in Attendees, use the select method.

Learn more

Read all rows
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('*')
Read specific columns
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('some_column,other_column')
Read referenced tables
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination
let { data: Attendees, error } = await supabase
  .from('Attendees')
  .select('*')
  .range(0, 9)
Filtering
Supabase provides a wide range of filters.

Learn more

With filtering
let { data: Attendees, error } = await supabase
  .from('Attendees')
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
  .from('Attendees')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows
const { data, error } = await supabase
  .from('Attendees')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows
const { data, error } = await supabase
  .from('Attendees')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Learn more

Update matching rows
const { data, error } = await supabase
  .from('Attendees')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Learn more

Delete matching rows
const { error } = await supabase
  .from('Attendees')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Learn more

Subscribe to all events
const Attendees = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Attendees' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts
const Attendees = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'Attendees' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates
const Attendees = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'Attendees' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes
const Attendees = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'Attendees' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows
const Attendees = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Attendees', filter: 'column_name=eq.someValue' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()