# Supabase Confirmation Emails System Documentation

## Overview

This documentation covers the complete confirmation email system for LodgeTix, including:
- Current system state and issues
- Database prerequisites that need fixing
- Edge function architecture
- Deployment procedures
- Testing and monitoring

## System Status

**Current State**: ❌ Not Working

### Key Issues:
1. **Edge Function Not Deployed**: `send-confirmation-email` exists in codebase but not deployed to Supabase
2. **Missing Email Orchestration**: `generate-confirmation` doesn't invoke email sending
3. **Database Issues**: Several database prerequisites need fixing before the email system can work

## Documentation Structure

1. [System Architecture](./01-system-architecture.md) - How the system is designed to work
2. [Current Issues](./02-current-issues.md) - Detailed breakdown of what's broken
3. [Database Prerequisites](./03-database-prerequisites.md) - Database fixes required before deployment
4. [Edge Functions Guide](./04-edge-functions-guide.md) - Details on each Edge function
5. [Deployment Guide](./05-deployment-guide.md) - Step-by-step deployment instructions
6. [Testing Guide](./06-testing-guide.md) - How to test the system
7. [Troubleshooting](./07-troubleshooting.md) - Common issues and solutions
8. [Monitoring & Operations](./08-monitoring-operations.md) - How to monitor the system

## Quick Reference

### Critical Environment Variables
- `RESEND_API_KEY` - Required for sending emails
- `EMAIL_FROM_ADDRESS` - Sender email (optional, defaults to noreply@lodgetix.com)
- `EMAIL_FROM_NAME` - Sender name (optional, defaults to LodgeTix)

### Edge Functions
- `generate-confirmation` - Generates confirmation numbers and orchestrates emails
- `send-confirmation-email` - Sends actual emails via Resend
- `generate-attendee-qr` - Generates QR codes for attendees
- `generate-ticket-qr` - Generates QR codes for tickets

### Database Components
- `registrations` table with proper triggers
- `webhook_logs` table for debugging
- `confirmation_emails` table for tracking sent emails
- Proper RLS policies for security

## Priority Action Items

1. **Fix Database Issues** (See [Database Prerequisites](./03-database-prerequisites.md))
2. **Deploy Edge Functions** (See [Deployment Guide](./05-deployment-guide.md))
3. **Update Email Orchestration** (See [Current Issues](./02-current-issues.md))
4. **Test End-to-End** (See [Testing Guide](./06-testing-guide.md))

## Support

For issues or questions:
- Check [Troubleshooting](./07-troubleshooting.md) first
- Review logs in Supabase Dashboard
- Check `webhook_logs` table for trigger activity