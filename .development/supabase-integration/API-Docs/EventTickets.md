EventTickets
Description
Manages ticket inventory and capacity for each event and ticket type.

Cancel

Save
Column
eventTicketId
Required
Type
string
Format
uuid
Description
Primary key for the event ticket record.

Cancel

Save
Select eventTicketId
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select('eventTicketId')
Column
eventId
Required
Type
string
Format
text
Description
Reference to the event this ticket inventory is for.

Cancel

Save
Select eventId
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select('eventId')
Column
ticketDefinitionId
Optional
Type
string
Format
uuid
Description
Reference to the ticket definition/type.

Cancel

Save
Select ticketDefinitionId
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select('ticketDefinitionId')
Column
totalCapacity
Required
Type
number
Format
integer
Description
Total number of tickets available for this event and ticket type.

Cancel

Save
Select totalCapacity
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select('totalCapacity')
Column
availableCount
Required
Type
number
Format
integer
Description
Current count of available tickets.

Cancel

Save
Select availableCount
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select('availableCount')
Column
reservedCount
Required
Type
number
Format
integer
Description
Current count of reserved but not purchased tickets.

Cancel

Save
Select reservedCount
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select('reservedCount')
Column
soldCount
Required
Type
number
Format
integer
Description
Current count of sold tickets.

Cancel

Save
Select soldCount
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select('soldCount')
Column
price
Required
Type
number
Format
numeric
Description
Current price for this ticket type at this event.

Cancel

Save
Select price
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select('price')
Column
status
Required
Type
string
Format
character varying
Description
Status of this ticket type (Active, Inactive, SoldOut, etc.).

Cancel

Save
Select status
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
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
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select('createdAt')
Column
updatedAt
Required
Type
string
Format
timestamp with time zone
Description
Click to edit.

Cancel

Save
Select updatedAt
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select('updatedAt')
Column
eventUuid
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select eventUuid
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select('eventUuid')
Read rows
To read rows in EventTickets, use the select method.

Learn more

Read all rows
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select('*')
Read specific columns
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select('some_column,other_column')
Read referenced tables
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
  .select('*')
  .range(0, 9)
Filtering
Supabase provides a wide range of filters.

Learn more

With filtering
let { data: EventTickets, error } = await supabase
  .from('EventTickets')
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
  .from('EventTickets')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows
const { data, error } = await supabase
  .from('EventTickets')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows
const { data, error } = await supabase
  .from('EventTickets')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Learn more

Update matching rows
const { data, error } = await supabase
  .from('EventTickets')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Learn more

Delete matching rows
const { error } = await supabase
  .from('EventTickets')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Learn more

Subscribe to all events
const EventTickets = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'EventTickets' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts
const EventTickets = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'EventTickets' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates
const EventTickets = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'EventTickets' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes
const EventTickets = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'EventTickets' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows
const EventTickets = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'EventTickets', filter: 'column_name=eq.someValue' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()