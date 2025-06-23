# Check-in & Badging Feature - Product Requirements Document

## Executive Summary

The Check-in & Badging feature transforms LodgeTix from a registration-only platform into a comprehensive event management solution. This feature replaces manual check-in lists and handwritten badges with a digital QR code system, automated badge printing, and mobile staff applications. It delivers professional event entry management critical for fraternal organizations while providing real-time attendance analytics and streamlined event operations.

**Key Outcomes:**
- Replace manual check-in processes with QR code scanning
- Automate professional badge generation and printing
- Provide real-time attendance tracking and analytics
- Enable mobile event staff applications
- Maintain professional appearance standards for fraternal events

## Core Components

### 1. QR Code Check-in System

**Technical Implementation:**
- **QR Data Structure**: Extends existing `TicketQRDataV2` and `AttendeeQRData` interfaces
- **Generation**: Leverages existing `QRCodeService` with enhanced check-in specific data
- **Storage**: Uses established Supabase storage buckets (`ticket-qr-codes`)
- **Security**: SHA-256 checksums with function-specific validation keys

**Functional Specification:**
- Each attendee receives a unique QR code containing encrypted attendance verification data
- QR codes embed: function_id, attendee_id, registration_id, ticket_type, security hash
- Codes are generated during registration completion and included in confirmation emails
- Staff scan codes using mobile devices for instant verification and check-in processing

**Technical Details:**
```typescript
interface CheckInQRData extends AttendeeQRData {
  type: 'CHECK_IN';
  badgeTemplate?: string; // Badge template identifier
  accessLevel?: string;   // VIP, General, Staff access levels
  dietaryReqs?: string;   // Dietary requirements flag
  specialNeeds?: string;  // Special needs flag
}
```

### 2. Mobile Staff Check-in Application

**Technical Architecture:**
- **Framework**: Next.js Progressive Web App (PWA) optimized for mobile devices
- **Authentication**: Supabase Auth with event staff role-based access control
- **Offline Capability**: Service Worker with local storage for offline check-ins
- **Real-time Sync**: Supabase Realtime for instant attendance updates

**Core Functionality:**
- **QR Scanner**: Camera-based QR code scanning with built-in validation
- **Attendee Lookup**: Search by name, confirmation number, or badge number
- **Batch Check-in**: Process multiple attendees simultaneously
- **Status Management**: Track check-in, check-out, and no-show statuses

**Technical Implementation:**
```typescript
interface StaffAppState {
  eventId: string;
  staffMember: StaffProfile;
  checkInQueue: CheckInRecord[];
  offlineMode: boolean;
  syncStatus: 'synced' | 'pending' | 'error';
}

interface CheckInRecord {
  attendeeId: string;
  checkInTime: string;
  staffMemberId: string;
  method: 'qr_scan' | 'manual_search' | 'batch';
  location?: string; // Entry point identifier
}
```

### 3. Automated Badge Generation & Printing

**Badge Template System:**
- **Templates**: Configurable badge layouts using React-PDF generation
- **Branding**: Organization-specific logos, colors, and design elements
- **Data Fields**: Name, title, organization, access level, dietary indicators
- **Formats**: Standard name badge size (3.5" x 2.25") with print-ready specifications

**Printing Integration:**
- **API Integration**: Support for network printers via IPP (Internet Printing Protocol)
- **Local Printing**: Browser-based printing for desktop badge stations
- **Batch Processing**: Generate and queue multiple badges for efficient printing
- **Quality Control**: Preview system before print execution

**Technical Specification:**
```typescript
interface BadgeTemplate {
  id: string;
  name: string;
  organizationId: string;
  layout: {
    width: number;    // Badge width in mm
    height: number;   // Badge height in mm
    elements: BadgeElement[];
  };
  printSettings: {
    paperSize: string;
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number; };
  };
}

interface BadgeElement {
  type: 'text' | 'image' | 'qr' | 'shape';
  position: { x: number; y: number; };
  properties: Record<string, any>;
  dataSource?: string; // attendee.firstName, event.name, etc.
}
```

### 4. Real-time Dashboard & Analytics

**Staff Dashboard:**
- **Live Attendance**: Real-time check-in counts and trending
- **Event Overview**: Total registered vs. checked-in attendees
- **Status Monitoring**: Staff activity, scan rates, and system health
- **Alert System**: No-shows, VIP arrivals, and capacity warnings

**Analytics & Reporting:**
- **Attendance Patterns**: Check-in timing analysis and peak period identification
- **Dietary/Special Needs**: Real-time catering and accessibility requirements
- **Historical Data**: Event comparison and attendance trend analysis
- **Export Capabilities**: CSV/PDF reports for post-event analysis

## User Stories & Acceptance Criteria

### User Story 1: Event Staff QR Code Check-in

**As an** event staff member  
**I want** to scan attendee QR codes on my mobile device  
**So that** I can quickly verify registrations and check attendees into the event

**Acceptance Criteria:**
```gherkin
Given I am an authenticated event staff member
And I have access to the mobile check-in application
When I scan an attendee's QR code
Then the system should:
- Validate the QR code authenticity within 2 seconds
- Display attendee details (name, ticket type, dietary requirements)
- Mark the attendee as checked-in with timestamp
- Show confirmation message with check-in number
- Update real-time dashboard immediately

Given the QR code is invalid or expired
When I attempt to scan it
Then the system should:
- Display clear error message explaining the issue
- Offer manual lookup alternative
- Log the failed attempt for security monitoring
- Provide troubleshooting guidance

Given I am in an area with poor internet connectivity
When I scan multiple QR codes
Then the system should:
- Store check-ins locally in offline mode
- Display offline indicator to staff
- Sync automatically when connectivity returns
- Preserve check-in timestamps accurately
```

### User Story 2: Automated Badge Printing

**As an** event organizer  
**I want** badges to print automatically when attendees check in  
**So that** attendees receive professional name badges without manual intervention

**Acceptance Criteria:**
```gherkin
Given an attendee has been successfully checked in
And automated badge printing is enabled for the event
When the check-in process completes
Then the system should:
- Generate a badge using the organization's template
- Include attendee name, title, and organization
- Add dietary requirement indicators if applicable
- Send print job to designated badge printer
- Confirm successful print job completion

Given the printer is offline or has an error
When a badge print is attempted
Then the system should:
- Display error notification to staff
- Queue the badge for later printing
- Offer manual print retry option
- Log the printing issue for technical support

Given I want to print badges in batches
When I select multiple checked-in attendees
Then the system should:
- Generate all badges simultaneously
- Optimize print layout for badge sheet efficiency
- Provide print preview before execution
- Track which badges have been printed successfully
```

### User Story 3: Real-time Attendance Dashboard

**As an** event organizer  
**I want** to view real-time attendance statistics on a dashboard  
**So that** I can monitor event capacity and make operational decisions

**Acceptance Criteria:**
```gherkin
Given I have organizer access to the event dashboard
When I access the real-time attendance view
Then I should see:
- Current checked-in count vs. total registrations
- Check-in rate trending over time
- Staff activity levels and locations
- Upcoming VIP or special attendee arrivals
- Dietary requirements summary for catering

Given an attendee checks in
When the check-in is processed
Then the dashboard should:
- Update attendance count within 5 seconds
- Refresh trending charts automatically
- Highlight any capacity or operational alerts
- Update dietary/special needs counters

Given I need to export attendance data
When I request a report
Then the system should:
- Generate CSV with all check-in records
- Include attendee details and check-in timestamps
- Provide summary statistics
- Email the report to my registered address
```

### User Story 4: Manual Check-in Fallback

**As an** event staff member  
**I want** to manually check in attendees when QR codes are unavailable  
**So that** registration issues don't prevent event entry

**Acceptance Criteria:**
```gherkin
Given an attendee doesn't have a QR code
When I need to check them in manually
Then I should be able to:
- Search by last name, email, or confirmation number
- View matching registration records
- Select the correct attendee record
- Complete check-in with manual verification note

Given multiple attendees share similar names
When I search for an attendee
Then the system should:
- Display all matching records with distinguishing details
- Show ticket types and registration details
- Highlight exact name matches first
- Allow filtering by confirmation number or email

Given I need to check in a walk-up attendee
When they don't have a registration
Then the system should:
- Offer walk-up registration option
- Collect minimum required information
- Generate temporary badge if applicable
- Flag as walk-up for organizer review
```

## Data Models

### Core Check-in Tables

```sql
-- Check-in events tracking
CREATE TABLE check_in_events (
  check_in_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id UUID NOT NULL REFERENCES attendees(attendee_id),
  registration_id UUID NOT NULL REFERENCES registrations(registration_id),
  function_id UUID NOT NULL REFERENCES functions(function_id),
  staff_user_id UUID REFERENCES auth.users(id),
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_in_method check_in_method_enum NOT NULL,
  check_in_location TEXT,
  badge_printed_at TIMESTAMPTZ,
  badge_print_job_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badge templates for organizations
CREATE TABLE badge_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(organization_id),
  template_name VARCHAR(100) NOT NULL,
  template_data JSONB NOT NULL, -- Badge layout and design
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff permissions for events
CREATE TABLE event_staff (
  staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_id UUID NOT NULL REFERENCES functions(function_id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  staff_role staff_role_enum NOT NULL,
  permissions JSONB, -- Check-in, badge printing, reports access
  assigned_location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check-in statistics cache for performance
CREATE TABLE check_in_stats (
  stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_id UUID NOT NULL REFERENCES functions(function_id),
  stat_date DATE NOT NULL,
  total_registered INTEGER NOT NULL,
  total_checked_in INTEGER NOT NULL,
  peak_check_in_hour INTEGER,
  avg_check_in_time INTERVAL,
  dietary_requirements_summary JSONB,
  hourly_check_ins JSONB, -- Array of hourly counts
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Enums and Supporting Types

```sql
-- Check-in method tracking
CREATE TYPE check_in_method_enum AS ENUM (
  'qr_scan',
  'manual_search', 
  'batch_import',
  'walk_up',
  'manual_override'
);

-- Staff role permissions
CREATE TYPE staff_role_enum AS ENUM (
  'admin',          -- Full access
  'check_in_staff', -- Check-in and badge printing
  'monitor',        -- Dashboard view only
  'support'         -- Manual check-in only
);

-- Badge printing status
CREATE TYPE badge_status_enum AS ENUM (
  'pending',
  'printing',
  'printed',
  'failed',
  'reprinted'
);
```

## Integration Points

### 1. Registration System Integration

**Registration Completion Trigger:**
- Automatically generate QR codes when registration payment is confirmed
- Update confirmation emails to include QR codes and check-in instructions
- Create attendee records in check-in system with default "not_checked_in" status

**Technical Implementation:**
```typescript
// Extend existing registration completion webhook
export async function handleRegistrationComplete(registrationData: RegistrationComplete) {
  // Existing confirmation email logic...
  
  // Generate check-in QR codes for all attendees
  const qrService = getQRCodeService();
  const checkInCodes = await Promise.all(
    registrationData.attendees.map(attendee => 
      qrService.generateCheckInQR({
        attendeeId: attendee.id,
        registrationId: registrationData.id,
        functionId: registrationData.functionId,
        accessLevel: attendee.ticketType.accessLevel
      })
    )
  );
  
  // Update confirmation email template with QR codes
  await sendEnhancedConfirmationEmail(registrationData, checkInCodes);
}
```

### 2. Supabase Realtime Integration

**Real-time Updates:**
- Check-in events broadcast to staff dashboards immediately
- Attendance counters update across all connected devices
- Badge printing status updates for staff monitoring

**Channel Configuration:**
```typescript
// Subscribe to check-in events for specific function
supabase
  .channel(`check-ins:${functionId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'check_in_events',
    filter: `function_id=eq.${functionId}`
  }, (payload) => {
    updateAttendanceStats(payload.new);
    notifyStaffOfCheckIn(payload.new);
  })
  .subscribe();
```

### 3. Email Template Enhancement

**Confirmation Email Updates:**
- Include QR code images in existing email templates
- Add check-in instructions and venue information
- Provide backup manual check-in procedures

**Template Extensions:**
```tsx
// Extend existing IndividualConfirmationEmail component
interface EnhancedConfirmationProps extends IndividualConfirmationEmailProps {
  checkInQRCodes: Array<{
    attendeeId: string;
    qrCodeUrl: string;
  }>;
  checkInInstructions: {
    venueLocation: string;
    checkInHours: string;
    contactInfo: string;
  };
}
```

### 4. Mobile PWA Integration

**Progressive Web App Features:**
- Offline-first architecture using existing service worker patterns
- Camera API integration for QR code scanning
- Local storage for offline check-in queuing
- Push notifications for system alerts

## Business Rules

### 1. Access Control & Security

**Staff Authentication:**
- Staff must be explicitly assigned to events with defined roles
- QR code scanning requires active staff session with valid permissions
- All check-in activities are logged with staff member identification
- Multi-factor authentication required for administrative functions

**QR Code Security:**
- QR codes expire 24 hours after event end time
- Each scan attempt validates against function-specific security keys
- Failed scan attempts are logged and monitored for security threats
- QR codes cannot be duplicated or transferred between attendees

### 2. Check-in Process Rules

**Single Check-in Policy:**
- Each attendee can only be checked in once per event
- Duplicate check-in attempts display warning with original check-in details
- Staff can override duplicate check-ins with administrative approval
- Check-out functionality available for multi-day events

**Timing Restrictions:**
- Check-in opens 2 hours before event start time
- Early check-in requires staff override with reason code
- Late check-in (after event start + 1 hour) flags attendee as late arrival
- No-show status automatically assigned 24 hours post-event

### 3. Badge Printing Rules

**Automatic Printing Triggers:**
- Badge prints immediately upon successful check-in (if enabled)
- Failed print jobs automatically retry 3 times with 30-second intervals
- Manual reprint requires staff approval and reason documentation
- Batch printing limited to 50 badges per job for printer reliability

**Badge Content Validation:**
- All badge data validated against registration information
- Dietary requirement indicators added automatically from attendee records
- Organization logos and branding applied based on attendee's lodge/organization
- Badge template selection based on ticket type and access level

### 4. Data Privacy & Retention

**Personal Information Handling:**
- Check-in data stored in compliance with GDPR and local privacy laws
- Attendee photos (if captured) require explicit consent
- Staff can only access attendee data necessary for check-in purposes
- Check-in records retained for 7 years for audit and analytics purposes

**Data Export Restrictions:**
- Only authorized organizers can export attendance data
- Exported data excludes sensitive personal details (dietary, medical)
- Export logs maintained for compliance auditing
- Bulk data access requires additional authentication verification

### 5. Offline Operation Rules

**Offline Mode Activation:**
- Automatic offline mode when internet connectivity drops below threshold
- Local storage limited to 500 check-in records to prevent device memory issues
- Offline check-ins sync in chronological order when connectivity returns
- Conflict resolution prioritizes server data for duplicate entries

**Data Synchronization:**
- Maximum 24-hour offline operation before requiring connectivity
- Background sync attempts every 30 seconds when partially connected
- Manual sync trigger available for staff in poor connectivity areas
- Sync status indicators displayed prominently in staff interface

### 6. Emergency Procedures

**System Failure Protocols:**
- Paper backup check-in lists generated 24 hours before event
- Manual badge printing procedures documented for each event
- Emergency contact information provided to all staff members
- Offline-capable device required as backup for primary check-in station

**Escalation Procedures:**
- Technical issues escalated to system administrator within 15 minutes
- Staff supervisor notified of repeated scan failures or security alerts
- Organizer dashboard displays system health status and alerts
- Emergency override codes available for critical check-in situations

## Success Metrics

### 1. Operational Efficiency Metrics

**Check-in Speed:**
- **Target**: Average check-in time < 30 seconds per attendee
- **Measurement**: Time from QR scan to badge print completion
- **Baseline**: Current manual process averages 2-3 minutes per attendee

**Staff Productivity:**
- **Target**: 1 staff member can process 120 attendees per hour
- **Measurement**: Check-ins completed per staff member per hour
- **Baseline**: Manual process: 20-30 attendees per hour per staff member

**Error Reduction:**
- **Target**: < 2% check-in errors (wrong attendee, duplicate entry)
- **Measurement**: Check-in corrections required / total check-ins
- **Baseline**: Manual process: 8-12% error rate

### 2. User Experience Metrics

**Attendee Satisfaction:**
- **Target**: > 95% attendees rate check-in experience as "excellent" or "good"
- **Measurement**: Post-event survey responses
- **Questions**: Check-in speed, staff helpfulness, badge quality

**Staff Satisfaction:**
- **Target**: > 90% staff prefer digital check-in over manual process
- **Measurement**: Staff feedback survey after events
- **Focus Areas**: Ease of use, technical reliability, training adequacy

### 3. System Performance Metrics

**QR Code Scan Success Rate:**
- **Target**: > 98% successful scans on first attempt
- **Measurement**: Successful scans / total scan attempts
- **Monitoring**: Real-time dashboard with alert thresholds

**Badge Printing Reliability:**
- **Target**: > 95% successful badge prints without manual intervention
- **Measurement**: Successful prints / total print jobs initiated
- **Tracking**: Print job status monitoring and failure categorization

**Real-time Update Performance:**
- **Target**: Dashboard updates within 5 seconds of check-in completion
- **Measurement**: Time between check-in event and dashboard update
- **Monitoring**: Performance metrics tracked per event size

### 4. Business Impact Metrics

**Event Setup Time Reduction:**
- **Target**: 75% reduction in pre-event check-in setup time
- **Measurement**: Staff hours required for check-in preparation
- **Baseline**: Manual setup: 4-6 hours, Target: 1-1.5 hours

**Post-Event Reporting Efficiency:**
- **Target**: Attendance reports available within 15 minutes of event end
- **Measurement**: Time from event end to report generation
- **Baseline**: Manual compilation: 2-4 hours

**Professional Appearance Enhancement:**
- **Target**: 100% events use professionally printed badges
- **Measurement**: Events with printed badges / total events
- **Quality Standard**: Consistent branding, clear text, durable materials

### 5. Adoption and Growth Metrics

**Feature Adoption Rate:**
- **Target**: 80% of events use digital check-in within 6 months of launch
- **Measurement**: Events using digital check-in / total events
- **Tracking**: Monthly adoption rate and trend analysis

**Staff Training Success:**
- **Target**: < 2 hours training time required per staff member
- **Measurement**: Training completion time and competency assessment
- **Success Criteria**: Independent operation after training completion

**Customer Retention Impact:**
- **Target**: 5% increase in event organizer retention rate
- **Measurement**: Organizers continuing to use platform year-over-year
- **Attribution**: Correlation with check-in feature usage

---

## Implementation Considerations

### Technical Dependencies
- **Camera API**: Required for QR code scanning on mobile devices
- **Service Workers**: Essential for offline functionality
- **WebRTC**: Optional for advanced camera features
- **Printer Drivers**: IPP protocol support for network printing

### Security Requirements
- **SSL/TLS**: All check-in communications must use HTTPS
- **API Rate Limiting**: Prevent abuse of check-in endpoints
- **Audit Logging**: Complete trail of all check-in activities
- **Data Encryption**: Sensitive attendee data encrypted at rest and in transit

### Scalability Planning
- **Concurrent Users**: Support 50+ staff members scanning simultaneously
- **High Volume Events**: Handle 2000+ attendee check-ins within 2-hour window
- **Database Performance**: Optimized queries for real-time dashboard updates
- **CDN Integration**: Badge template assets served via content delivery network

This comprehensive Check-in & Badging feature transforms LodgeTix into a complete event management platform, delivering professional event operations while maintaining the platform's core values of simplicity, reliability, and user experience excellence.