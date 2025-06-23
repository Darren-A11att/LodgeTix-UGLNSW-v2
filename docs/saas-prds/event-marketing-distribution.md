# PRD: Event Marketing & Distribution Feature

## Executive Summary

The Event Marketing & Distribution feature transforms LodgeTix from a manual registration platform into an automated event discovery and marketing system. This feature automatically lists events on the LodgeTix platform for member discovery, replaces word-of-mouth and manual email marketing with systematic distribution, and leverages network effects where each event markets future events through SEO optimization and social media integration.

### Business Impact
- **Replace manual marketing processes** with automated event discovery
- **Increase event visibility** through SEO-optimized listings and social sharing
- **Drive network effects** where successful events promote future events
- **Reduce organiser workload** by automating event promotion and distribution
- **Improve member engagement** through personalized event recommendations

## Core Components

### 1. Event Discovery Platform

**Technical Specification:**
The Event Discovery Platform creates a centralized hub where all published events are automatically listed with filtering, search, and categorization capabilities.

**Implementation Details:**
- Extends existing `FeaturedEventsSection` component pattern
- Uses existing `EventCard` display components
- Leverages current database schema (`events`, `functions`, `locations` tables)
- Implements server-side rendering for SEO optimization
- Adds advanced filtering and search capabilities

**Concrete Outcomes:**
- Automatic event listings immediately upon publication
- Searchable event database with multiple filter options
- Responsive grid layout supporting desktop and mobile viewing
- Integration with existing event registration workflows

### 2. SEO-Optimized Event Pages

**Technical Specification:**
Individual SEO-optimized pages for each event with structured data markup, social media meta tags, and search engine friendly URLs.

**Implementation Details:**
- Creates dynamic routes at `/events/[eventSlug]` and `/functions/[functionSlug]/events/[eventSlug]`
- Implements OpenGraph and Twitter Card meta tags
- Adds JSON-LD structured data for rich snippets
- Generates SEO-friendly URLs using existing slug system
- Includes server-side rendering for optimal search indexing

**Concrete Outcomes:**
- Each event gets a dedicated, SEO-friendly URL
- Search engines can index event details with rich snippets
- Social media shares display attractive previews
- Improved search rankings for event-related queries

### 3. Social Media Integration

**Technical Specification:**
Automated social media sharing capabilities with pre-formatted content for Facebook, Twitter, LinkedIn, and WhatsApp sharing.

**Implementation Details:**
- Social sharing buttons on event pages
- Pre-populated sharing text with event details
- Open Graph meta tags for rich social previews
- WhatsApp sharing integration for lodge communication
- Optional automated posting capabilities (future enhancement)

**Concrete Outcomes:**
- One-click social media sharing for events
- Consistent branding across all shared content
- Increased event reach through member social networks
- Trackable social media engagement metrics

### 4. Member Event Recommendations

**Technical Specification:**
Personalized event recommendation system based on past attendance, preferences, and member profile data.

**Implementation Details:**
- Recommendation algorithm using member registration history
- Preference system based on event types and locations
- Email notification system for recommended events
- Dashboard widget showing personalized suggestions
- Analytics tracking for recommendation effectiveness

**Concrete Outcomes:**
- Increased event attendance through targeted recommendations
- Improved member engagement with relevant event suggestions
- Data-driven insights into member preferences
- Automated member retention through event discovery

### 5. Email Marketing Automation

**Technical Specification:**
Automated email campaigns triggered by event creation, registration deadlines, and member behavior patterns.

**Implementation Details:**
- Integration with existing Supabase Edge Functions for email delivery
- Template system for different email types (announcements, reminders, recommendations)
- Segmentation based on member preferences and past behavior
- Automated scheduling for optimal delivery times
- Unsubscribe management and preference centers

**Concrete Outcomes:**
- Automated event promotion reducing manual effort
- Increased registration rates through timely reminders
- Personalized communication improving member engagement
- Compliance with email marketing regulations

## User Stories & Acceptance Criteria

### Epic 1: Event Discovery for Members

**User Story 1.1:** Event Browsing
**As a** lodge member  
**I want** to browse all upcoming events across different lodges  
**So that** I can discover events I'm interested in attending

**Acceptance Criteria:**
```gherkin
Given I am on the events discovery page
When I view the event listings
Then I should see all published events from all functions
And each event should display title, date, location, and brief description
And events should be sorted by date with upcoming events first
And I should be able to filter by location, event type, and date range
```

**User Story 1.2:** Event Search
**As a** lodge member  
**I want** to search for events by keywords  
**So that** I can quickly find events related to my interests

**Acceptance Criteria:**
```gherkin
Given I am on the events discovery page
When I enter search terms in the search box
Then the event list should filter to show only matching events
And search should work across event titles, descriptions, and locations
And search results should highlight matching terms
And I should see a count of matching results
```

**User Story 1.3:** Event Details
**As a** potential event attendee  
**I want** to view comprehensive event details  
**So that** I can make an informed decision about attending

**Acceptance Criteria:**
```gherkin
Given I click on an event card
When the event detail page loads
Then I should see complete event information including:
- Full description and agenda
- Location details with map integration
- Pricing information for all ticket types
- Registration instructions and requirements
- Contact information for questions
And I should be able to proceed directly to registration
```

### Epic 2: SEO & Social Media Integration

**User Story 2.1:** Social Media Sharing
**As a** lodge member  
**I want** to share interesting events on social media  
**So that** I can inform my network about upcoming events

**Acceptance Criteria:**
```gherkin
Given I am viewing an event detail page
When I click on social media sharing buttons
Then the sharing dialog should open with pre-populated content including:
- Event title and description
- Event date and location
- Direct link to event registration
- Attractive preview image
And the shared content should display properly on the target platform
```

**User Story 2.2:** Search Engine Visibility
**As an** event organiser  
**I want** my events to appear in search engine results  
**So that** more people can discover and attend my events

**Acceptance Criteria:**
```gherkin
Given I have published an event
When someone searches for related terms on Google
Then my event should appear in search results with:
- Event title as the clickable link
- Meta description showing event summary
- Structured data showing date, location, and pricing
- Proper URL structure for easy navigation
```

### Epic 3: Automated Marketing

**User Story 3.1:** Event Recommendations
**As a** registered member  
**I want** to receive personalized event recommendations  
**So that** I don't miss events that interest me

**Acceptance Criteria:**
```gherkin
Given I have attended events in the past
When new similar events are published
Then I should receive email recommendations that include:
- Events matching my past attendance patterns
- Events in my preferred locations
- Events from organisers I've attended before
- Clear unsubscribe and preference management options
```

**User Story 3.2:** Event Reminders
**As an** event attendee  
**I want** to receive timely reminders about events I'm registered for  
**So that** I don't miss important events

**Acceptance Criteria:**
```gherkin
Given I have registered for an event
When the event date approaches
Then I should receive automated reminder emails:
- 2 weeks before the event (confirmation and preparation)
- 1 week before the event (final details and logistics)
- 24 hours before the event (reminder with venue details)
And reminders should include relevant event information and instructions
```

### Epic 4: Organiser Marketing Tools

**User Story 4.1:** Event Promotion Dashboard
**As an** event organiser  
**I want** to track how my event is being discovered and shared  
**So that** I can understand the effectiveness of different marketing channels

**Acceptance Criteria:**
```gherkin
Given I have published an event
When I access the organiser dashboard
Then I should see analytics including:
- Number of event page views
- Source of traffic (search, social media, direct links)
- Registration conversion rates
- Social media shares and engagement
- Email campaign performance metrics
```

**User Story 4.2:** Promotional Content Templates
**As an** event organiser  
**I want** access to pre-designed promotional templates  
**So that** I can easily create professional marketing materials

**Acceptance Criteria:**
```gherkin
Given I am creating promotional content for my event
When I access the template library
Then I should find templates for:
- Social media posts (Facebook, Twitter, Instagram)
- Email announcements and reminders
- Print flyers and posters
- WhatsApp sharing messages
And templates should auto-populate with my event details
```

## Data Models

### Enhanced Event Model

```typescript
interface MarketingEventType extends EventType {
  // Marketing-specific fields
  marketingData: {
    seoMetadata: {
      metaTitle: string;
      metaDescription: string;
      keywords: string[];
      canonicalUrl: string;
      structuredData: EventStructuredData;
    };
    socialMedia: {
      ogTitle: string;
      ogDescription: string;
      ogImage: string;
      twitterCard: 'summary_large_image';
      twitterTitle: string;
      twitterDescription: string;
      twitterImage: string;
    };
    discoverySettings: {
      isPromotable: boolean;
      targetAudience: string[];
      categories: string[];
      promotionPriority: 'high' | 'medium' | 'low';
    };
  };
  
  // Analytics tracking
  analytics: {
    viewCount: number;
    shareCount: number;
    clickThroughRate: number;
    conversionRate: number;
    trafficSources: Record<string, number>;
  };
}
```

### Event Analytics Model

```typescript
interface EventAnalytics {
  eventId: string;
  date: string;
  metrics: {
    pageViews: number;
    uniqueVisitors: number;
    socialShares: {
      facebook: number;
      twitter: number;
      linkedin: number;
      whatsapp: number;
    };
    trafficSources: {
      direct: number;
      search: number;
      social: number;
      email: number;
      referral: number;
    };
    registrationMetrics: {
      viewToRegistrationRate: number;
      registrationCompletionRate: number;
      averageTimeToRegister: number;
    };
  };
  created_at: string;
  updated_at: string;
}
```

### Member Preferences Model

```typescript
interface MemberPreferences {
  memberId: string;
  preferences: {
    eventTypes: string[];
    preferredLocations: string[];
    distanceRadius: number;
    timePreferences: {
      weekdays: boolean;
      weekends: boolean;
      evenings: boolean;
      afternoons: boolean;
    };
    communicationPreferences: {
      emailNotifications: boolean;
      reminderFrequency: 'weekly' | 'biweekly' | 'monthly';
      socialMediaUpdates: boolean;
    };
  };
  membershipHistory: {
    eventsAttended: string[];
    favoriteOrganisers: string[];
    averageAttendanceRate: number;
  };
  created_at: string;
  updated_at: string;
}
```

### Email Campaign Model

```typescript
interface EmailCampaign {
  campaignId: string;
  eventId: string;
  campaignType: 'announcement' | 'reminder' | 'recommendation' | 'follow-up';
  subject: string;
  content: string;
  targetAudience: {
    segmentCriteria: Record<string, any>;
    recipientCount: number;
  };
  scheduledDate: string;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  metrics: {
    sentCount: number;
    deliveredCount: number;
    openRate: number;
    clickRate: number;
    unsubscribeRate: number;
  };
  created_at: string;
  updated_at: string;
}
```

## Integration Points

### 1. Existing Event Management System

**Integration Details:**
- Extends current `EventType` interface with marketing metadata
- Leverages existing event creation and editing workflows
- Uses current database schema as foundation
- Integrates with existing RLS policies for data security

**Technical Implementation:**
- Add marketing fields to event creation forms
- Extend event service layer with marketing functionality
- Update event validation to include marketing requirements
- Maintain backward compatibility with existing event data

### 2. Registration & Payment System

**Integration Details:**
- Links marketing analytics with registration conversion rates
- Tracks marketing channel effectiveness in driving registrations
- Integrates with existing payment processing for complete funnel analysis
- Maintains connection between marketing efforts and revenue

**Technical Implementation:**
- Add tracking parameters to registration URLs from marketing channels
- Update registration services to capture traffic source data
- Integrate marketing analytics with existing payment completion tracking
- Create unified dashboard showing marketing ROI

### 3. Member Management System

**Integration Details:**
- Leverages existing member authentication and profiles
- Uses member registration history for recommendation algorithms
- Integrates with existing communication preferences
- Maintains member privacy and consent management

**Technical Implementation:**
- Extend member profile schema with preference data
- Use existing auth system for personalization
- Integrate with current email system for campaigns
- Respect existing privacy settings and consent mechanisms

### 4. Organiser Portal

**Integration Details:**
- Adds marketing tools to existing organiser dashboard
- Integrates marketing analytics with existing event management
- Extends current event publishing workflow with marketing options
- Maintains organiser permissions and access controls

**Technical Implementation:**
- Add marketing section to organiser portal navigation
- Extend existing event management pages with marketing features
- Integrate marketing analytics into existing reporting
- Use current organiser authentication and authorization

## Business Rules

### Event Publication Rules

```typescript
interface EventPublicationRules {
  // Automatic publication criteria
  autoPublish: {
    isEnabled: boolean;
    criteria: {
      hasCompleteTitleAndDescription: boolean;
      hasValidDateAndTime: boolean;
      hasLocationInformation: boolean;
      hasPricingInformation: boolean;
      hasMinimumImageQuality: boolean;
    };
  };
  
  // Marketing approval workflow
  approvalWorkflow: {
    requiresReview: boolean;
    reviewCriteria: string[];
    approverRoles: string[];
    autoApprovalRules: Record<string, any>;
  };
  
  // Content guidelines
  contentStandards: {
    minimumDescriptionLength: number;
    requiredFields: string[];
    prohibitedContent: string[];
    imageRequirements: {
      minimumWidth: number;
      minimumHeight: number;
      allowedFormats: string[];
      maximumFileSize: number;
    };
  };
}
```

### SEO Optimization Rules

```typescript
interface SEOOptimizationRules {
  // URL structure requirements
  urlStructure: {
    maxSlugLength: number;
    allowedCharacters: RegExp;
    duplicateHandling: 'suffix' | 'date' | 'random';
  };
  
  // Meta data requirements
  metadata: {
    titleLength: { min: number; max: number };
    descriptionLength: { min: number; max: number };
    keywordLimits: { min: number; max: number };
    requiredStructuredData: string[];
  };
  
  // Content optimization
  contentOptimization: {
    headingStructure: boolean;
    imageOptimization: boolean;
    loadTimeRequirements: number;
    mobileOptimization: boolean;
  };
}
```

### Email Marketing Rules

```typescript
interface EmailMarketingRules {
  // Sending frequency limits
  frequencyLimits: {
    maxEmailsPerWeek: number;
    maxEmailsPerMonth: number;
    cooldownPeriodHours: number;
    memberOptOutRespect: boolean;
  };
  
  // Content compliance
  contentCompliance: {
    requireUnsubscribeLink: boolean;
    requirePhysicalAddress: boolean;
    requireConsentConfirmation: boolean;
    prohibitedContent: string[];
  };
  
  // Segmentation rules
  segmentation: {
    maxSegmentSize: number;
    requiredSegmentCriteria: string[];
    personalDataUsage: Record<string, boolean>;
    retentionPeriod: number;
  };
}
```

### Analytics and Privacy Rules

```typescript
interface AnalyticsPrivacyRules {
  // Data collection limits
  dataCollection: {
    anonymizationRequired: boolean;
    retentionPeriodDays: number;
    allowedTrackingMethods: string[];
    consentRequirements: Record<string, boolean>;
  };
  
  // Reporting restrictions
  reporting: {
    minimumDatasetSize: number;
    aggregationRequirements: boolean;
    personalDataExclusion: boolean;
    accessControlRules: Record<string, string[]>;
  };
  
  // Member privacy protection
  privacyProtection: {
    dataMinimization: boolean;
    purposeLimitation: boolean;
    accuracyRequirements: boolean;
    memberRights: string[];
  };
}
```

## Success Metrics

### Primary Success Metrics

**Event Discovery Metrics:**
- **Event Page Views**: Target 500% increase in individual event page views
- **Search Traffic**: 300% increase in organic search traffic to event pages
- **Social Shares**: Average 25 social shares per published event
- **Member Engagement**: 40% of registered members actively browse event discovery platform monthly

**Registration Conversion Metrics:**
- **Discovery-to-Registration Rate**: Target 15% conversion rate from event discovery to registration
- **Marketing Channel Attribution**: Track conversion rates by traffic source (organic search, social media, email, direct)
- **Time to Registration**: Reduce average time from event discovery to registration by 50%
- **Cross-Event Discovery**: 30% of registrants discover and register for additional events

**SEO Performance Metrics:**
- **Search Rankings**: Average position 1-3 for event-related local search terms
- **Rich Snippet Appearance**: 80% of events appear with structured data in search results
- **Click-Through Rate**: 8% average CTR from search results to event pages
- **Local Search Visibility**: 90% visibility for "[location] masonic events" searches

### Secondary Success Metrics

**Email Marketing Performance:**
- **Open Rates**: Target 25% average open rate for event marketing emails
- **Click-Through Rates**: Target 8% average click-through rate
- **Unsubscribe Rate**: Maintain under 2% unsubscribe rate
- **Email-to-Registration Conversion**: 12% conversion rate from email clicks to registrations

**Social Media Engagement:**
- **Share Engagement**: Average 15 interactions (likes, comments, shares) per social media post
- **Social Traffic**: 20% of event page traffic from social media sources
- **User-Generated Content**: 25% of events shared by attendees receive user-generated content
- **Cross-Platform Reach**: Events shared across average 3 different social platforms

**Member Retention & Growth:**
- **Repeat Attendance**: 60% of members attend multiple events per year
- **Member Acquisition**: 25% increase in new member registrations through event discovery
- **Member Lifetime Value**: 30% increase in average revenue per member through increased event participation
- **Word-of-Mouth Amplification**: 40% of new registrations attributed to member referrals and social sharing

### Analytics Dashboard KPIs

**Real-Time Metrics:**
- Current month event registrations vs. same period last year
- Top performing events by registration conversion rate
- Most effective marketing channels by cost per acquisition
- Member engagement score based on event discovery and registration behavior

**Monthly Performance Reports:**
- Event discovery platform usage statistics
- SEO performance summary with search ranking improvements
- Email marketing campaign performance analysis
- Social media engagement and reach metrics
- Member preference trend analysis

**Quarterly Business Impact Assessment:**
- Overall event attendance growth attributable to marketing & distribution
- Revenue impact from improved event discovery and cross-promotion
- Cost savings from automated marketing vs. manual promotion
- Member satisfaction scores related to event discovery experience
- Organiser satisfaction with marketing tools and event promotion effectiveness

---

## Implementation Priority & Timeline

### Phase 1: Core Discovery Platform (Weeks 1-4)
- Event discovery page with filtering and search
- Enhanced event detail pages with SEO optimization
- Basic social media sharing functionality
- Analytics tracking implementation

### Phase 2: Email Marketing Automation (Weeks 5-8)
- Automated email campaign system
- Member preference management
- Template library for organisers
- Email performance analytics

### Phase 3: Advanced Features (Weeks 9-12)
- Recommendation engine implementation
- Advanced SEO features and structured data
- Organiser marketing dashboard
- Cross-platform social media integration

### Phase 4: Analytics & Optimization (Weeks 13-16)
- Advanced analytics dashboard
- A/B testing framework for marketing content
- Performance optimization based on user behavior
- Machine learning improvements for recommendations

This PRD provides a comprehensive roadmap for transforming LodgeTix into a powerful event marketing and distribution platform that serves both event organisers and attendees while maintaining the high security and user experience standards of the existing system.