# TODO-010: Send Individual Email

## Overview
Enable organizers to send emails to individual attendees directly from the platform.

## Acceptance Criteria
- [ ] "Send Email" button on attendee details
- [ ] Pre-fill recipient email and name
- [ ] Subject line and message body fields
- [ ] Send copy to organizer
- [ ] Track sent emails
- [ ] Show success/failure message
- [ ] Include event context in email

## Email Features
- Rich text editor (basic formatting)
- Preview before sending
- Default signature with org details
- Reply-to set to organizer email
- Automatic footer with unsubscribe

## Technical Requirements
- Use existing Resend integration
- Store sent emails in database
- Rate limiting (prevent spam)
- Validate email addresses
- Handle bounces gracefully

## Why This First in V2
Most common support task is answering attendee questions.

## Definition of Done
- Emails send successfully
- Formatted nicely
- Tracked in database
- Organizer gets copy