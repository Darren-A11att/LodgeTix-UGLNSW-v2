# TODO-004: View Event Registrations

## Overview
Display all registrations for a selected event with key attendee information.

## Acceptance Criteria
- [ ] Show all registrations for the event
- [ ] Display: Name, Email, Phone, Payment Status
- [ ] Include ticket type purchased
- [ ] Show registration date
- [ ] Filter by payment status (Paid/Pending)
- [ ] Search by attendee name
- [ ] Mobile-friendly table/card view

## Technical Requirements
- Paginated results (50 per page)
- Real-time search
- Responsive design (cards on mobile)
- Include related attendee data

## SQL Query
```sql
SELECT 
  r.*,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  json_agg(
    json_build_object(
      'attendee_id', a.attendeeid,
      'first_name', p.first_name,
      'last_name', p.last_name,
      'attendee_type', a.attendeetype,
      'dietary_requirements', a.dietaryrequirements
    )
  ) as attendees
FROM registrations r
JOIN customers c ON r.customer_id = c.id
JOIN attendees a ON a.registrationid = r.registration_id
JOIN people p ON a.person_id = p.person_id
WHERE r.event_id = $1
GROUP BY r.registration_id, c.id
```

## Why This Next
Core feature - organizers need to see who's registered.

## Definition of Done
- All registrations visible
- Can search and filter
- Contact information readily available
- Mobile responsive