AttendeeEvents
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
let { data: AttendeeEvents, error } = await supabase
  .from('AttendeeEvents')
  .select('id')
Column
attendeeId
Required
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select attendeeId
let { data: AttendeeEvents, error } = await supabase
  .from('AttendeeEvents')
  .select('attendeeId')
Column
eventId
Required
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select eventId
let { data: AttendeeEvents, error } = await supabase
  .from('AttendeeEvents')
  .select('eventId')
Column
status
Required
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select status
let { data: AttendeeEvents, error } = await supabase
  .from('AttendeeEvents')
  .select('status')
Column
createdAt
Required
Type
string
Format
timestamp with time zone
Description
Click to edit.

Cancel

Save
Select createdAt
let { data: AttendeeEvents, error } = await supabase
  .from('AttendeeEvents')
  .select('createdAt')
Read rows
To read rows in AttendeeEvents, use the select method.

Learn more

Read all rows
let { data: AttendeeEvents, error } = await supabase
  .from('AttendeeEvents')
  .select('*')
Read specific columns
let { data: AttendeeEvents, error } = await supabase
  .from('AttendeeEvents')
  .select('some_column,other_column')
Read referenced tables
let { data: AttendeeEvents, error } = await supabase
  .from('AttendeeEvents')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination
let { data: AttendeeEvents, error } = await supabase
  .from('AttendeeEvents')
  .select('*')
  .range(0, 9)
Filtering
Supabase provides a wide range of filters.

Learn more

With filtering
let { data: AttendeeEvents, error } = await supabase
  .from('AttendeeEvents')
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
  .from('AttendeeEvents')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows
const { data, error } = await supabase
  .from('AttendeeEvents')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows
const { data, error } = await supabase
  .from('AttendeeEvents')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Learn more

Update matching rows
const { data, error } = await supabase
  .from('AttendeeEvents')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Learn more

Delete matching rows
const { error } = await supabase
  .from('AttendeeEvents')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Learn more

Subscribe to all events
const AttendeeEvents = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'AttendeeEvents' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts
const AttendeeEvents = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'AttendeeEvents' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates
const AttendeeEvents = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'AttendeeEvents' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes
const AttendeeEvents = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'AttendeeEvents' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows
const AttendeeEvents = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'AttendeeEvents', filter: 'column_name=eq.someValue' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()