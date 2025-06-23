# PRD: Attendee Management & Communication Feature

## Executive Summary

The Attendee Management & Communication feature transforms LodgeTix into a comprehensive attendee lifecycle management platform by automating communication workflows, enabling targeted messaging, and providing emergency communication capabilities. This feature replaces manual phone calls and individual emails with intelligent, automated campaigns while maintaining the personal touch essential for masonic events.

**Key Benefits:**
- 80% reduction in manual communication overhead
- Automated reminder and follow-up campaigns
- Targeted messaging based on attendee segments
- Emergency broadcast capabilities
- Post-event feedback collection and analysis
- Centralized attendee engagement dashboard

---

## Core Components

### 1. Automated Email Campaign Engine

**Technical Specification:**
The campaign engine orchestrates time-based and trigger-based email sequences using a queue-based architecture with Supabase Edge Functions and Resend integration.

**Core Functions:**
- **Campaign Builder**: Visual workflow designer for creating multi-step email sequences
- **Template Management**: Reusable email templates with dynamic content injection
- **Scheduling Engine**: Cron-based scheduler with timezone awareness for optimal delivery timing
- **Delivery Optimization**: Smart sending based on recipient timezone and engagement patterns

**Concrete Outcomes:**
- Automated pre-event reminders (configurable timeline: 30, 14, 7, 1 days before)
- Registration confirmation sequences with payment reminders
- Post-event follow-up and feedback collection
- Custom milestone-based communications (e.g., dress code reminders, venue updates)

### 2. Attendee Segmentation & Targeting System

**Technical Specification:**
Dynamic segmentation engine that categorizes attendees based on registration data, behavior, and masonic profile information for targeted communications.

**Core Functions:**
- **Demographic Segmentation**: By lodge, grand lodge, masonic rank, age groups
- **Behavioral Segmentation**: Based on event history, payment status, engagement levels
- **Geographic Segmentation**: Location-based targeting for travel arrangements and local information
- **Custom Segment Builder**: Boolean logic interface for creating complex audience filters

**Concrete Outcomes:**
- Targeted messages for specific lodge members or masonic ranks
- Location-specific information (parking, accommodations, travel updates)
- VIP/dignitary-specific communications with special protocols
- New member onboarding sequences with educational content

### 3. Emergency Communication System

**Technical Specification:**
High-priority broadcast system with multiple delivery channels and delivery confirmation tracking for urgent communications.

**Core Functions:**
- **Instant Broadcast**: Immediate delivery to all registered attendees
- **Priority Escalation**: SMS fallback for critical communications
- **Delivery Confirmation**: Real-time tracking of message delivery and read receipts
- **Multi-Channel Distribution**: Email, SMS, and in-app notifications

**Concrete Outcomes:**
- Emergency event cancellations or postponements
- Last-minute venue changes or logistics updates
- Weather-related advisories and contingency plans
- Health and safety communications

### 4. Post-Event Survey & Feedback Engine

**Technical Specification:**
Automated survey distribution system with analytics dashboard for collecting and analyzing attendee feedback.

**Core Functions:**
- **Survey Builder**: Drag-and-drop interface for creating custom feedback forms
- **Automated Distribution**: Scheduled post-event survey delivery
- **Response Analytics**: Real-time analytics with visual dashboards
- **Sentiment Analysis**: AI-powered analysis of open-ended feedback

**Concrete Outcomes:**
- Standardized event satisfaction metrics
- Venue and catering feedback collection
- Speaker and program evaluation
- Future event preference gathering

---

## User Stories & Acceptance Criteria

### US1: Event Organizer - Automated Reminder Campaign

**As an** event organiser
**I want** to set up automated reminder emails for my event
**So that** I don't have to manually remind attendees and ensure better attendance

**Acceptance Criteria:**
```
Given I am organizing a masonic event
When I access the Campaign Builder
Then I should see pre-built reminder templates for masonic events

Given I select a reminder campaign template
When I customize the sending schedule
Then I should be able to set reminders for 30, 14, 7, and 1 days before the event

Given I activate an automated reminder campaign
When the scheduled time arrives
Then the system should automatically send personalized reminders to all registered attendees

Given a reminder email is sent
When an attendee receives it
Then it should include event details, their ticket information, and venue directions

Given the campaign is running
When I check the campaign dashboard
Then I should see delivery statistics, open rates, and click-through rates
```

### US2: Event Organizer - Emergency Communication

**As an** event organiser
**I want** to send urgent communications to all attendees
**So that** I can quickly inform them of critical changes or emergencies

**Acceptance Criteria:**
```
Given I need to communicate urgent information
When I access the Emergency Broadcast feature
Then I should see a priority send option with immediate delivery

Given I compose an emergency message
When I select the broadcast option
Then the system should send to all registered attendees within 5 minutes

Given I send an emergency broadcast
When attendees receive the message
Then it should be clearly marked as urgent with appropriate styling

Given I send an emergency communication
When I check the delivery report
Then I should see real-time delivery confirmation and read receipts

Given the emergency requires immediate action
When attendees don't open the email within 30 minutes
Then the system should trigger SMS backup notifications
```

### US3: Event Organizer - Attendee Segmentation

**As an** event organiser
**I want** to send targeted messages to specific groups of attendees
**So that** I can provide relevant information to different audience segments

**Acceptance Criteria:**
```
Given I have attendees from different lodges
When I create a new campaign
Then I should be able to select specific lodges as target segments

Given I want to send VIP-specific information
When I use the segment builder
Then I should be able to filter by masonic rank or membership tier

Given I create a geographic segment
When I select attendees by location
Then I should be able to send location-specific information (parking, accommodations)

Given I send a targeted message
When the campaign is delivered
Then only attendees matching the segment criteria should receive the message

Given I view campaign analytics
When I check the results
Then I should see performance metrics broken down by segment
```

### US4: Attendee - Personalized Communications

**As an** event attendee
**I want** to receive relevant, timely information about events I'm attending
**So that** I'm well-prepared and informed

**Acceptance Criteria:**
```
Given I have registered for an event
When reminder emails are sent
Then I should receive personalized messages with my specific ticket and event details

Given I am a member of a specific lodge
When targeted communications are sent
Then I should only receive messages relevant to my lodge or masonic profile

Given I prefer email communications
When I update my preferences
Then I should only receive messages via my preferred channel

Given I want to track my event information
When I receive communications
Then each message should include a direct link to my personal event dashboard

Given I need to update my information
When I click the update link in any communication
Then I should be able to modify my contact preferences and details
```

### US5: Event Organizer - Post-Event Analytics

**As an** event organiser
**I want** to collect and analyze feedback from attendees
**So that** I can improve future events and measure success

**Acceptance Criteria:**
```
Given my event has concluded
When the post-event sequence triggers
Then attendees should automatically receive feedback surveys within 24 hours

Given I create a feedback survey
When I use the survey builder
Then I should be able to include both rating scales and open-ended questions

Given attendees complete surveys
When I view the analytics dashboard
Then I should see response rates, satisfaction scores, and sentiment analysis

Given I want to improve future events
When I review feedback data
Then I should see actionable insights and recommendations

Given I need to report to stakeholders
When I export survey results
Then I should be able to generate comprehensive reports with visualizations
```

---

## Data Models

### Communication Campaigns Table
```sql
CREATE TABLE communication_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_id UUID REFERENCES functions(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50) NOT NULL, -- 'reminder', 'emergency', 'follow_up', 'custom'
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Campaign Steps Table
```sql
CREATE TABLE campaign_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES communication_campaigns(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL, -- 'time_based', 'event_based', 'condition_based'
  trigger_config JSONB NOT NULL, -- Configuration for trigger (days before event, etc.)
  email_template_id UUID REFERENCES email_templates(id),
  segment_config JSONB, -- Audience targeting rules
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Email Templates Table
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- 'reminder', 'confirmation', 'emergency', 'survey'
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  variables JSONB, -- Dynamic variables available in template
  is_system_template BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Attendee Segments Table
```sql
CREATE TABLE attendee_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_id UUID REFERENCES functions(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  segment_rules JSONB NOT NULL, -- Boolean logic for segment criteria
  attendee_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Communication Logs Table
```sql
CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES communication_campaigns(id),
  step_id UUID REFERENCES campaign_steps(id),
  attendee_id UUID REFERENCES attendees(id),
  email_address VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  status VARCHAR(50) NOT NULL, -- 'queued', 'sent', 'delivered', 'opened', 'clicked', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  external_message_id VARCHAR(255), -- Resend message ID
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Feedback Surveys Table
```sql
CREATE TABLE feedback_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_id UUID REFERENCES functions(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  survey_config JSONB NOT NULL, -- Survey questions and structure
  distribution_config JSONB, -- When and how to send
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'closed'
  response_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Survey Responses Table
```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES feedback_surveys(id),
  attendee_id UUID REFERENCES attendees(id),
  responses JSONB NOT NULL, -- Survey answers
  completion_status VARCHAR(20) DEFAULT 'partial', -- 'partial', 'complete'
  submitted_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Communication Preferences Table
```sql
CREATE TABLE communication_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id UUID REFERENCES attendees(id),
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  marketing_emails BOOLEAN DEFAULT TRUE,
  reminder_emails BOOLEAN DEFAULT TRUE,
  emergency_notifications BOOLEAN DEFAULT TRUE,
  preferred_frequency VARCHAR(20) DEFAULT 'normal', -- 'minimal', 'normal', 'frequent'
  timezone VARCHAR(50),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Integration Points

### 1. Registration System Integration
- **Trigger Point**: New registration completion
- **Data Flow**: Registration data → Attendee segments → Welcome campaign
- **API Endpoints**: 
  - `POST /api/communications/triggers/registration-complete`
  - `GET /api/attendees/{id}/communication-history`

### 2. Payment Processing Integration
- **Trigger Point**: Payment status changes
- **Data Flow**: Payment updates → Payment reminder campaigns
- **API Endpoints**:
  - `POST /api/communications/triggers/payment-received`
  - `POST /api/communications/triggers/payment-failed`

### 3. Event Management Integration
- **Trigger Point**: Event details updates
- **Data Flow**: Event changes → Emergency communications → All attendees
- **API Endpoints**:
  - `POST /api/communications/broadcasts/event-update`
  - `GET /api/events/{id}/communication-campaigns`

### 4. User Management Integration
- **Trigger Point**: Profile updates, preference changes
- **Data Flow**: User preferences → Segmentation rules → Campaign targeting
- **API Endpoints**:
  - `PUT /api/attendees/{id}/communication-preferences`
  - `GET /api/attendees/{id}/segments`

### 5. Analytics & Reporting Integration
- **Data Sources**: Communication logs, survey responses, engagement metrics
- **Output**: Dashboard widgets, automated reports, performance insights
- **API Endpoints**:
  - `GET /api/analytics/communication-performance`
  - `GET /api/reports/campaign-effectiveness`

---

## Business Rules

### Email Campaign Rules

1. **Reminder Timing Constraints**
   - Minimum 24-hour gap between reminder emails
   - No reminders sent within 2 hours of event start
   - Maximum 4 automated reminders per event

2. **Content Personalization**
   - All emails must include attendee name and event-specific details
   - Masonic protocols must be respected in salutations and content
   - Lodge-specific information must be accurate and current

3. **Delivery Optimization**
   - Emails sent during recipient's business hours (9 AM - 6 PM local time)
   - Emergency communications bypass timing restrictions
   - Failed deliveries trigger automatic retry after 4 hours

### Segmentation Rules

4. **Audience Targeting**
   - Segments must contain minimum 1 attendee to activate campaigns
   - Personal data (email, phone) never exposed in segment definitions
   - Segment criteria must be based on registration or profile data only

5. **Privacy Compliance**
   - All communications include unsubscribe mechanism
   - Communication preferences honored immediately
   - Personal data anonymized in analytics reports

### Emergency Communication Rules

6. **Priority Handling**
   - Emergency broadcasts bypass all timing restrictions
   - SMS backup triggered if email not opened within 30 minutes
   - Maximum 2 emergency communications per event

7. **Authorization Requirements**
   - Emergency broadcasts require admin or organizer role
   - All emergency communications logged with sender identity
   - Approval workflow for emergency SMS campaigns

### Survey & Feedback Rules

8. **Survey Distribution**
   - Post-event surveys sent 24 hours after event conclusion
   - Survey reminders limited to 2 follow-ups maximum
   - Survey responses remain anonymous unless explicitly opted-in

9. **Data Retention**
   - Communication logs retained for 2 years
   - Survey responses retained for 5 years for trend analysis
   - Personal communication preferences retained until account deletion

---

## Success Metrics

### Primary KPIs

1. **Communication Efficiency**
   - **Metric**: Manual communication time reduction
   - **Target**: 80% reduction in organizer communication overhead
   - **Measurement**: Time tracking before/after implementation

2. **Engagement Rates**
   - **Metric**: Email open and click-through rates
   - **Target**: 40% open rate, 8% click-through rate
   - **Measurement**: Campaign analytics dashboard

3. **Event Attendance**
   - **Metric**: No-show rate reduction
   - **Target**: 15% reduction in no-shows through better communication
   - **Measurement**: Attendance tracking vs. registration numbers

### Secondary KPIs

4. **Response Quality**
   - **Metric**: Survey response rates and completion rates
   - **Target**: 60% response rate, 85% completion rate
   - **Measurement**: Survey analytics

5. **Communication Reach**
   - **Metric**: Delivery success rate
   - **Target**: 95% successful delivery rate
   - **Measurement**: Email delivery logs

6. **User Satisfaction**
   - **Metric**: Communication preference compliance
   - **Target**: <2% unsubscribe rate, >4.0/5.0 communication satisfaction
   - **Measurement**: Preference tracking and feedback surveys

### Operational Metrics

7. **System Reliability**
   - **Metric**: Campaign execution success rate
   - **Target**: 99.5% successful campaign execution
   - **Measurement**: System logs and error tracking

8. **Emergency Response**
   - **Metric**: Emergency communication delivery speed
   - **Target**: 95% delivered within 5 minutes
   - **Measurement**: Emergency broadcast logs

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
- Database schema implementation
- Basic email template system
- Simple reminder campaigns
- Integration with existing registration system

### Phase 2: Segmentation & Targeting (Weeks 5-8)
- Attendee segmentation engine
- Advanced campaign builder
- Template personalization
- Analytics dashboard foundation

### Phase 3: Advanced Features (Weeks 9-12)
- Emergency communication system
- Post-event surveys
- SMS integration
- Advanced analytics and reporting

### Phase 4: Optimization & Polish (Weeks 13-16)
- Performance optimization
- User experience refinements
- Advanced automation rules
- Comprehensive testing and deployment

---

## Risk Mitigation

### Technical Risks
- **Email Deliverability**: Implement domain authentication and reputation management
- **Scale Limitations**: Design queue-based architecture for high-volume sending
- **Data Consistency**: Implement event-driven architecture with proper error handling

### Business Risks
- **Privacy Compliance**: Built-in GDPR compliance with consent management
- **Communication Overload**: Intelligent frequency capping and preference management
- **Emergency Misuse**: Authorization controls and audit logging for emergency features

### User Adoption Risks
- **Complexity Concerns**: Provide pre-built templates and guided setup workflows
- **Training Requirements**: Comprehensive documentation and video tutorials
- **Migration Challenges**: Gradual rollout with parallel manual processes during transition

This comprehensive PRD provides the technical foundation, user experience design, and business framework needed to successfully implement the Attendee Management & Communication feature in LodgeTix, transforming it from a basic ticketing platform into a complete attendee lifecycle management solution.