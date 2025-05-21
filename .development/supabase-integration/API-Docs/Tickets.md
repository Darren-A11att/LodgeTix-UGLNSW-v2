Tickets
Description
Links an Attendee to a specific sub-event/session they are registered for.

Cancel

Save
Column
ticketid
Required
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select ticketid
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('ticketid')
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
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('attendeeid')
Column
eventid
Required
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select eventid
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('eventid')
Column
ticketdefinitionid
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select ticketdefinitionid
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('ticketdefinitionid')
Column
pricepaid
Required
Type
number
Format
numeric
Description
Click to edit.

Cancel

Save
Select pricepaid
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('pricepaid')
Column
seatinfo
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select seatinfo
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('seatinfo')
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
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('status')
Column
checkedinat
Optional
Type
string
Format
timestamp with time zone
Description
Click to edit.

Cancel

Save
Select checkedinat
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('checkedinat')
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
let { data: Tickets, error } = await supabase
  .from('Tickets')
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
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('updatedat')
Column
reservationId
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select reservationId
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('reservationId')
Column
reservationExpiresAt
Optional
Type
string
Format
timestamp with time zone
Description
Click to edit.

Cancel

Save
Select reservationExpiresAt
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('reservationExpiresAt')
Column
originalPrice
Optional
Type
number
Format
numeric
Description
Click to edit.

Cancel

Save
Select originalPrice
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('originalPrice')
Column
currency
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select currency
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('currency')
Column
paymentStatus
Optional
Type
string
Format
character varying
Description
Click to edit.

Cancel

Save
Select paymentStatus
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('paymentStatus')
Column
purchasedAt
Optional
Type
string
Format
timestamp with time zone
Description
Click to edit.

Cancel

Save
Select purchasedAt
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('purchasedAt')
Column
eventTicketId
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select eventTicketId
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('eventTicketId')
Column
packageId
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select packageId
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('packageId')
Read rows
To read rows in Tickets, use the select method.

Learn more

Read all rows
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('*')
Read specific columns
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('some_column,other_column')
Read referenced tables
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination
let { data: Tickets, error } = await supabase
  .from('Tickets')
  .select('*')
  .range(0, 9)
Filtering
Supabase provides a wide range of filters.

Learn more

With filtering
let { data: Tickets, error } = await supabase
  .from('Tickets')
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
  .from('Tickets')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows
const { data, error } = await supabase
  .from('Tickets')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows
const { data, error } = await supabase
  .from('Tickets')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Learn more

Update matching rows
const { data, error } = await supabase
  .from('Tickets')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Learn more

Delete matching rows
const { error } = await supabase
  .from('Tickets')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Learn more

Subscribe to all events
const Tickets = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Tickets' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts
const Tickets = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'Tickets' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates
const Tickets = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'Tickets' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes
const Tickets = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'Tickets' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows
const Tickets = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Tickets', filter: 'column_name=eq.someValue' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()