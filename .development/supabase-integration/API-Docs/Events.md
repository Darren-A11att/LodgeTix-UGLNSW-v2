Events
Description
Primary events table for LodgeTix platform with support for new fields

Cancel

Save
Column
title
Required
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select title
let { data: Events, error } = await supabase
  .from('Events')
  .select('title')
Column
location
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select location
let { data: Events, error } = await supabase
  .from('Events')
  .select('location')
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
let { data: Events, error } = await supabase
  .from('Events')
  .select('description')
Column
type
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select type
let { data: Events, error } = await supabase
  .from('Events')
  .select('type')
Column
isPurchasableIndividually
Optional
Type
boolean
Format
boolean
Description
Click to edit.

Cancel

Save
Select isPurchasableIndividually
let { data: Events, error } = await supabase
  .from('Events')
  .select('isPurchasableIndividually')
Column
maxAttendees
Optional
Type
number
Format
bigint
Description
Click to edit.

Cancel

Save
Select maxAttendees
let { data: Events, error } = await supabase
  .from('Events')
  .select('maxAttendees')
Column
featured
Optional
Type
boolean
Format
boolean
Description
Click to edit.

Cancel

Save
Select featured
let { data: Events, error } = await supabase
  .from('Events')
  .select('featured')
Column
imageUrl
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select imageUrl
let { data: Events, error } = await supabase
  .from('Events')
  .select('imageUrl')
Column
eventIncludes
Optional
Type
Format
text[]
Description
Click to edit.

Cancel

Save
Select eventIncludes
let { data: Events, error } = await supabase
  .from('Events')
  .select('eventIncludes')
Column
importantInformation
Optional
Type
Format
text[]
Description
Click to edit.

Cancel

Save
Select importantInformation
let { data: Events, error } = await supabase
  .from('Events')
  .select('importantInformation')
Column
latitude
Optional
Type
number
Format
numeric
Description
Click to edit.

Cancel

Save
Select latitude
let { data: Events, error } = await supabase
  .from('Events')
  .select('latitude')
Column
longitude
Optional
Type
number
Format
numeric
Description
Click to edit.

Cancel

Save
Select longitude
let { data: Events, error } = await supabase
  .from('Events')
  .select('longitude')
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
let { data: Events, error } = await supabase
  .from('Events')
  .select('createdAt')
Column
isMultiDay
Optional
Type
boolean
Format
boolean
Description
Click to edit.

Cancel

Save
Select isMultiDay
let { data: Events, error } = await supabase
  .from('Events')
  .select('isMultiDay')
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
let { data: Events, error } = await supabase
  .from('Events')
  .select('id')
Column
parentEventId
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select parentEventId
let { data: Events, error } = await supabase
  .from('Events')
  .select('parentEventId')
Column
registrationAvailabilityId
Optional
Type
string
Format
uuid
Description
FK to registration_availabilities table, defining who can register.

Cancel

Save
Select registrationAvailabilityId
let { data: Events, error } = await supabase
  .from('Events')
  .select('registrationAvailabilityId')
Column
displayScopeId
Optional
Type
string
Format
uuid
Description
FK to display_scopes table, defining who can see the event.

Cancel

Save
Select displayScopeId
let { data: Events, error } = await supabase
  .from('Events')
  .select('displayScopeId')
Column
slug
Required
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select slug
let { data: Events, error } = await supabase
  .from('Events')
  .select('slug')
Column
eventStart
Optional
Type
string
Format
timestamp with time zone
Description
Click to edit.

Cancel

Save
Select eventStart
let { data: Events, error } = await supabase
  .from('Events')
  .select('eventStart')
Column
eventEnd
Optional
Type
string
Format
timestamp with time zone
Description
Click to edit.

Cancel

Save
Select eventEnd
let { data: Events, error } = await supabase
  .from('Events')
  .select('eventEnd')
Column
locationid
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select locationid
let { data: Events, error } = await supabase
  .from('Events')
  .select('locationid')
Column
organiserorganisationid
Optional
Type
string
Format
uuid
Description
Click to edit.

Cancel

Save
Select organiserorganisationid
let { data: Events, error } = await supabase
  .from('Events')
  .select('organiserorganisationid')
Column
price
Optional
Type
number
Format
numeric
Description
Click to edit.

Cancel

Save
Select price
let { data: Events, error } = await supabase
  .from('Events')
  .select('price')
Column
eventId
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select eventId
let { data: Events, error } = await supabase
  .from('Events')
  .select('eventId')
Column
subtitle
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select subtitle
let { data: Events, error } = await supabase
  .from('Events')
  .select('subtitle')
Column
organizer_name
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select organizer_name
let { data: Events, error } = await supabase
  .from('Events')
  .select('organizer_name')
Column
organizer_contact
Optional
Type
json
Format
jsonb
Description
Click to edit.

Cancel

Save
Select organizer_contact
let { data: Events, error } = await supabase
  .from('Events')
  .select('organizer_contact')
Column
is_published
Optional
Type
boolean
Format
boolean
Description
Click to edit.

Cancel

Save
Select is_published
let { data: Events, error } = await supabase
  .from('Events')
  .select('is_published')
Column
publish_option
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select publish_option
let { data: Events, error } = await supabase
  .from('Events')
  .select('publish_option')
Column
regalia
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select regalia
let { data: Events, error } = await supabase
  .from('Events')
  .select('regalia')
Column
regalia_description
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select regalia_description
let { data: Events, error } = await supabase
  .from('Events')
  .select('regalia_description')
Column
dress_code
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select dress_code
let { data: Events, error } = await supabase
  .from('Events')
  .select('dress_code')
Column
degree_type
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select degree_type
let { data: Events, error } = await supabase
  .from('Events')
  .select('degree_type')
Column
sections
Optional
Type
json
Format
jsonb
Description
Click to edit.

Cancel

Save
Select sections
let { data: Events, error } = await supabase
  .from('Events')
  .select('sections')
Column
attendance
Optional
Type
json
Format
jsonb
Description
Click to edit.

Cancel

Save
Select attendance
let { data: Events, error } = await supabase
  .from('Events')
  .select('attendance')
Column
documents
Optional
Type
json
Format
jsonb
Description
Click to edit.

Cancel

Save
Select documents
let { data: Events, error } = await supabase
  .from('Events')
  .select('documents')
Column
related_events
Optional
Type
Format
uuid[]
Description
Click to edit.

Cancel

Save
Select related_events
let { data: Events, error } = await supabase
  .from('Events')
  .select('related_events')
Column
location_json
Optional
Type
json
Format
jsonb
Description
Click to edit.

Cancel

Save
Select location_json
let { data: Events, error } = await supabase
  .from('Events')
  .select('location_json')
Column
organiser_logo
Optional
Type
string
Format
text
Description
Click to edit.

Cancel

Save
Select organiser_logo
let { data: Events, error } = await supabase
  .from('Events')
  .select('organiser_logo')
Read rows
To read rows in Events, use the select method.

Learn more

Read all rows
let { data: Events, error } = await supabase
  .from('Events')
  .select('*')
Read specific columns
let { data: Events, error } = await supabase
  .from('Events')
  .select('some_column,other_column')
Read referenced tables
let { data: Events, error } = await supabase
  .from('Events')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination
let { data: Events, error } = await supabase
  .from('Events')
  .select('*')
  .range(0, 9)
Filtering
Supabase provides a wide range of filters.

Learn more

With filtering
let { data: Events, error } = await supabase
  .from('Events')
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
  .from('Events')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows
const { data, error } = await supabase
  .from('Events')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows
const { data, error } = await supabase
  .from('Events')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Learn more

Update matching rows
const { data, error } = await supabase
  .from('Events')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Learn more

Delete matching rows
const { error } = await supabase
  .from('Events')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Learn more

Subscribe to all events
const Events = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Events' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts
const Events = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'Events' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates
const Events = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'Events' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes
const Events = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'Events' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows
const Events = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Events', filter: 'column_name=eq.someValue' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()