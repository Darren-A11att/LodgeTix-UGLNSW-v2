Bash
EventPackages
Description
Click to edit.

Cancel

Save
Column
name
Required
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select name
let { data: EventPackages, error } = await supabase
  .from('EventPackages')
  .select('name')
Column
description
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select description
let { data: EventPackages, error } = await supabase
  .from('EventPackages')
  .select('description')
Column
includes_description
Optional
Type
Format
text[]
Description
Click to edit.

Cancel

Save
Select includes_description
let { data: EventPackages, error } = await supabase
  .from('EventPackages')
  .select('includes_description')
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
let { data: EventPackages, error } = await supabase
  .from('EventPackages')
  .select('created_at')
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
let { data: EventPackages, error } = await supabase
  .from('EventPackages')
  .select('id')
Column
parent_event_id
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select parent_event_id
let { data: EventPackages, error } = await supabase
  .from('EventPackages')
  .select('parent_event_id')
Read rows
To read rows in EventPackages, use the select method.

Learn more

Read all rows
let { data: EventPackages, error } = await supabase
  .from('EventPackages')
  .select('*')
Read specific columns
let { data: EventPackages, error } = await supabase
  .from('EventPackages')
  .select('some_column,other_column')
Read referenced tables
let { data: EventPackages, error } = await supabase
  .from('EventPackages')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination
let { data: EventPackages, error } = await supabase
  .from('EventPackages')
  .select('*')
  .range(0, 9)
Filtering
Supabase provides a wide range of filters.

Learn more

With filtering
let { data: EventPackages, error } = await supabase
  .from('EventPackages')
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
  .from('EventPackages')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows
const { data, error } = await supabase
  .from('EventPackages')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows
const { data, error } = await supabase
  .from('EventPackages')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Learn more

Update matching rows
const { data, error } = await supabase
  .from('EventPackages')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Learn more

Delete matching rows
const { error } = await supabase
  .from('EventPackages')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Learn more

Subscribe to all events
const EventPackages = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'EventPackages' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts
const EventPackages = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'EventPackages' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates
const EventPackages = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'EventPackages' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes
const EventPackages = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'EventPackages' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows
const EventPackages = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'EventPackages', filter: 'column_name=eq.someValue' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()