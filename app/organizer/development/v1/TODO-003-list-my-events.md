# TODO-003: List My Events

## Overview
Show a simple list of all events for the organization, with registration counts.

## Acceptance Criteria
- [ ] Display all events (parent and child)
- [ ] Show event date, title, location
- [ ] Display registration count for each event
- [ ] Show event status (upcoming/past)
- [ ] Click event to view registrations
- [ ] Sort by date (upcoming first)

## Technical Requirements
- Query events where organiserorganisationid matches
- Include registration counts in query
- Use server components for performance
- Handle events with no registrations

## SQL Query
```sql
SELECT 
  e.*,
  COUNT(DISTINCT r.registration_id) as registration_count
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id
WHERE e.organiserorganisationid = $1
GROUP BY e.id
ORDER BY e.event_start ASC
```

## Why This Next
Organizers need to see their events before viewing registrations.

## Definition of Done
- All organization events displayed
- Registration counts accurate
- Can click through to registration list