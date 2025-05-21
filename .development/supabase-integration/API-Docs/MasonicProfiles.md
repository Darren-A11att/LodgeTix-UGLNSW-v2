Bash
MasonicProfiles
Description
Stores reusable Masonic details linked to a Contact.

Cancel

Save
Column
masonicprofileid
Required
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select masonicprofileid
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
  .select('masonicprofileid')
Column
masonictitle
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select masonictitle
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
  .select('masonictitle')
Column
rank
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select rank
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
  .select('rank')
Column
grandrank
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select grandrank
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
  .select('grandrank')
Column
grandofficer
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select grandofficer
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
  .select('grandofficer')
Column
grandoffice
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select grandoffice
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
  .select('grandoffice')
Column
lodgeid
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select lodgeid
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
  .select('lodgeid')
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
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
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
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
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
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
  .select('person_id')
Read rows
To read rows in MasonicProfiles, use the select method.

Learn more

Read all rows
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
  .select('*')
Read specific columns
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
  .select('some_column,other_column')
Read referenced tables
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
  .select('*')
  .range(0, 9)
Filtering
Supabase provides a wide range of filters.

Learn more

With filtering
let { data: MasonicProfiles, error } = await supabase
  .from('MasonicProfiles')
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
  .from('MasonicProfiles')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows
const { data, error } = await supabase
  .from('MasonicProfiles')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows
const { data, error } = await supabase
  .from('MasonicProfiles')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Learn more

Update matching rows
const { data, error } = await supabase
  .from('MasonicProfiles')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Learn more

Delete matching rows
const { error } = await supabase
  .from('MasonicProfiles')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Learn more

Subscribe to all events
const MasonicProfiles = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'MasonicProfiles' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts
const MasonicProfiles = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'MasonicProfiles' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates
const MasonicProfiles = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'MasonicProfiles' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes
const MasonicProfiles = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'MasonicProfiles' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows
const MasonicProfiles = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'MasonicProfiles', filter: 'column_name=eq.someValue' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()