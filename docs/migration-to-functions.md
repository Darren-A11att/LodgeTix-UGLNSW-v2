But, our app is currently supposed to only serve one organiser at the moment as well. \    │
│   \                                                                                          │
│   parent events are supposed to be a container for all the child events and their tickets    │
│   etc. \                                                                                     │
│   \                                                                                          │
│   What I am thinking is this\                                                                │
│   \\                                                                                         │
│   \                                                                                          │
│   1. We move the whole "parent event" concept from being an event to being a "function" we   │
│   need to then create a seperate "functions" table then we have clear seperation of          │
│   concerns.\                                                                                 │
│   \                                                                                          │
│   Then, we can add the following feature flags to the environment variables\                 │
│   - filter_to: function | organisation                                                       │
│   - function_id\                                                                             │
│   - organisation_id\                                                                         │
│   \                                                                                          │
│   if filter to is set to function it will filter to events which are related to the          │
│   function_id set in the environment varaibles and then EVERYTHING is done against that      │
│   function_id and its descendant or related  entities in the database. while on the other    │
│   hand (and we wont fully implement this now) if the filter_to is set to organisation then   │
│   the application will do EVERYTHING against that organisation_id and its related or         │
│   descendant entities in the database; if you get what I am trying to say.\                  │
│   \                                                                                          │
│                                                                                              │
│   So Here is how we need to migrate the database and the refactor the codbase:               │
│   \                                                                                          │
│   organisations\                                                                             │
│   - - organisation_id\                                                                       │
│   - - hosting_functions 1:n fk link to functions table for function_id that it is the host   │
│   for                                                                                        │
│   - - registrations_made fk to registrations table for the registration made to functions &  │
│   events\                                                                                    │
│   - - (remaining existing columns)                                                           │
│                                                                                              │
│   - functions                                                                                │
│   - - function_id                                                                            │
│   - - events 1:n fk link to events table for event_id                                        │
│   - - organiser 1:1 fk link to organisations table for organisation_id                       │
│   - - registrations 1:n fk link to registrations table for registration_id\                  │
│   - - (and relevant data for the home page, registration wizard, etc)                        │
│                                                                                              │
│   - - events have                                                                            │
│   - - - event_id                                                                             │
│   - - - event_tickets                                                                        │
│   - - - location (fk link to locations)                                                      │
│   - - - eligibility_criteria                                                                 │
│   - - - attendees\                                                                           │
│   - - - (inherit the organiser details from the function)                                    │
│                                                                                              │
│   packages\                                                                                  │
│   - - - package_id\\                                                                         │
│   - - - (remaining current columns)\                                                         │
│   \                                                                                          │
│   event_tickets\                                                                             │
│   - - - event_ticket_id\\                                                                    │
│   - - - (existing columns)                                                                   │
│   \                                                                                          │
│                                                                                              │
│   contacts                                                                                   │
│   - - - contact_id\                                                                          │
│   - - - (remaining current columns)\                                                         │
│   \                                                                                          │
│   registrations\                                                                             │
│   - - - registration_id\                                                                     │
│   - - - function_id (fk to functions) [need to change from event_id to function_id]          │
│   - - - registration_type individuals, lodges, delegations\                                  │
│   - - - attendees 1:n fk to attendees table for attendee_id\                                 │
│   - - - registration (jsonb of full payload from registration wizard)\                       │
│   - - - registration_contact fk to customers table for customer_id\                          │
│   - - - organisation fk to organisations table for organisation_id                           │
│   - - - (reminaing current columns)\\                                                        │
│   \                                                                                          │
│   attendees\                                                                                 │
│   - - - attendee_id\                                                                         │
│   - - - attending_events 1:n fk array to events table for event_id\                          │
│   - - - attendee_type (mason, guest, partner)\                                               │
│   - - - is_partner 1:1 fk to attendee is partner of                                          │
│   - - - has_partner 1:1 fk to attendee is parter to\\                                        │
│   - - - contact_preference\                                                                  │
│   - - - contact 1:1 fk to contacts_table for contact_id                                      │
│   - - - tickets 1:n fk to tickets table\                                                     │
│   \                                                                                          │
│   tickets\                                                                                   │
│   - - - ticket_id\                                                                           │
│   - - - attendee_id 1:1 fk to attendees table for attendee_id                                │
│   - - - event_id 1:1 fk to events table for event_id\                                        │
│   - - - (remaining current columns)\                                                         │
│   \                                                                                          │
│   \                                                                                          │
│   I think this can simply how our application operates and makes it easier to perform CRUD   │
│   operations                                                                                 │
│                                                                                              │
│   We are going to need a migration to apply to the database, and we are going to need to     │
│   refactor the codebase to use this                              