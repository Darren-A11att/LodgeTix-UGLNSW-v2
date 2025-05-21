# Events Mapping Integration for Order Submission

## Overview

This document provides the specific mapping between the Events data format and our registration submission process. Understanding the Events structure is essential for correctly associating registrations with events in the Supabase database.

## Events Data Analysis

Based on the Events data sample, we observe the following structure:

```sql
INSERT INTO "Events" (
  id, 
  slug, 
  title, 
  description, 
  event_start, 
  event_end, 
  location, 
  image_url, 
  type, 
  featured, 
  is_multi_day, 
  parent_event_id, 
  event_includes, 
  important_information, 
  latitude, 
  longitude, 
  is_purchasable_individually, 
  created_at, 
  updated_at
) VALUES (...)
```

### Key Fields for Registration Integration

From the Events table structure, these fields are most relevant to our registration integration:

1. **id** - UUID primary key, used as `eventId` in Registrations
2. **slug** - URL-friendly identifier used in routes
3. **title** - Event name to display in confirmations
4. **event_start** / **event_end** - For showing event timing in confirmations
5. **location** - For showing venue in confirmations
6. **type** - May influence registration type options
7. **is_multi_day** - May influence ticket options
8. **event_includes** - Array of included items, helpful for displaying what's included in tickets
9. **important_information** - Important details for attendees
10. **is_purchasable_individually** - Whether tickets can be purchased individually

### Special Event Types

The data indicates several types of Masonic events with potentially different registration requirements:

- **ceremonial** (e.g., Grand Installation)
- **business** (e.g., Quarterly Communication)
- **memorial** (e.g., ANZAC Day Remembrance)
- **cultural** (e.g., Festival of Music)
- **charity** (e.g., Charity Golf Day)
- **educational** (e.g., Masonic Education Conference)
- **social** (e.g., Grand Master's Charity Ball)
- **conference** (e.g., Regional Conference)
- **installation** (e.g., Lodge Installation)
- **public** (e.g., Masonic Open Day)

These event types may influence:
- Available ticket types
- Registration options (individual, lodge, delegation)
- Required attendee information
- Partner/guest options

## Integration Strategy

### 1. Event Lookup in Client Flow

During the registration process, we need to provide event details to the API:

```typescript
// Client-side preparation of event data for API
const eventData = {
  id: event.id,              // UUID for referencing in registration
  name: event.title,         // For displaying in confirmations
  date: event.event_start,   // For ticket timing information
  location: event.location,  // For venue information
  includes: event.event_includes, // What's included in the registration
  type: event.type           // Type of event for potential business logic
};

// Include this in the submission data
const submissionData = {
  attendees: [...],
  tickets: {...},
  event: eventData,
  // Other required fields
};
```

### 2. Event Reference in Database

When storing the registration in Supabase, we'll link to the event:

```typescript
// In the API route handler
const { error: regError } = await supabase
  .from('Registrations')
  .insert({
    registrationId: registrationId,
    eventId: validatedData.event.id, // Link to the specific event
    // Other registration fields
  });
```

### 3. Event Type-Based Customization

We can implement special handling based on event type:

```typescript
// Example of type-based customization in registration mapper
function mapRegistrationToDatabase(data) {
  // Common mapping logic
  const registrationData = {
    // Common fields
  };
  
  // Event type-specific adjustments
  switch (data.event.type) {
    case 'ceremonial':
      // Special handling for ceremonial events
      registrationData.specialRequirements = 'Full Regalia Required';
      break;
    case 'social':
      // Special handling for social events
      registrationData.partnerIncluded = true;
      break;
    // Other event types
  }
  
  return {
    registrationData,
    // Other mapped data
  };
}
```

## Registration Information Display

Using the event data, we can enhance the confirmation step to show relevant event details:

```tsx
// In ConfirmationStep component
const eventDetails = (
  <Card>
    <CardHeader>
      <CardTitle>Event Details</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium">
              {new Date(event.event_start).toLocaleDateString('en-AU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-sm text-gray-600">Date</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium">
              {new Date(event.event_start).toLocaleTimeString('en-AU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {event.event_end && ` - ${new Date(event.event_end).toLocaleTimeString('en-AU', {
                hour: '2-digit',
                minute: '2-digit',
              })}`}
            </p>
            <p className="text-sm text-gray-600">Time</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium">{event.location}</p>
            <p className="text-sm text-gray-600">Location</p>
          </div>
        </div>
        
        {event.event_includes && event.event_includes.length > 0 && (
          <div className="flex items-start gap-3">
            <CheckSquare className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Includes</p>
              <ul className="text-sm text-gray-600">
                {event.event_includes.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {event.important_information && event.important_information.length > 0 && (
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Important Information</p>
              <ul className="text-sm text-gray-600">
                {event.important_information.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <Info className="w-3 h-3 mr-2 text-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);
```

## Calendar Integration

We can utilize the event data to create better calendar invites in the confirmation step:

```typescript
// In the ConfirmationStep component
const addToCalendar = useCallback(() => {
  if (!event) return;

  const startDate = new Date(event.event_start);
  const endDate = event.event_end ? new Date(event.event_end) : new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

  // Build a more detailed description using event details
  const description = `
${event.description || ''}

Location: ${event.location}
${event.important_information ? `\nImportant Information:\n${event.important_information.join('\n')}` : ''}

Registration ID: ${registrationId}
Confirmation Number: ${confirmationNumber}
  `.trim();

  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').replace('.000', '')}
DTEND:${endDate.toISOString().replace(/[-:]/g, '').replace('.000', '')}
SUMMARY:${event.title}
LOCATION:${event.location}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
END:VEVENT
END:VCALENDAR
  `.trim();

  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.slug}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}, [event, registrationId, confirmationNumber]);
```

## Conclusion

Integrating with the Events data structure enhances our registration submission process by:

1. Properly linking registrations to specific events in the database
2. Providing rich event information in the confirmation step
3. Enabling event type-specific customization of the registration process
4. Improving the user experience through detailed confirmations and calendar integration

This integration ensures that registrations are correctly associated with events while leveraging the rich event metadata to enhance the user experience throughout the registration process.