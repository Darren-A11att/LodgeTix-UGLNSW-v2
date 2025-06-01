import { Resend } from 'resend';
import { BulkEmailTemplate, BulkEmailTemplateData, generateBulkEmailText } from '@/components/organiser/email-templates/bulk-email-template';
import React from 'react';

// Initialize Resend with API key from environment
let resend: Resend;

// Lazy initialization to handle missing API key during module loading
function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Define the from email address for your domain
const FROM_EMAIL = 'LodgeTix Organiser <organiser@m.lodgetix.io>';

export interface OrganiserBulkEmailOptions {
  recipients: Array<{
    email: string;
    name: string;
    registrationId?: string;
  }>;
  subject: string;
  content: string;
  functionDetails?: {
    name: string;
    date: string;
    location: string;
  };
  senderDetails: {
    name: string;
    organisationName: string;
    organisationLogo?: string;
  };
  ctaButton?: {
    text: string;
    url: string;
  };
  sendCopyToOrganiser?: boolean;
  organiserEmail?: string;
}

export interface OrganiserEmailResult {
  sent: number;
  failed: number;
  failedEmails?: string[];
  batchId?: string;
}

/**
 * Send bulk emails to multiple recipients from an organiser
 */
export async function sendOrganiserBulkEmail(options: OrganiserBulkEmailOptions): Promise<OrganiserEmailResult> {
  const {
    recipients,
    subject,
    content,
    functionDetails,
    senderDetails,
    ctaButton,
    sendCopyToOrganiser,
    organiserEmail,
  } = options;

  const result: OrganiserEmailResult = {
    sent: 0,
    failed: 0,
    failedEmails: [],
  };

  try {
    // Prepare batch emails
    const batchEmails = recipients.map((recipient) => {
      const templateData: BulkEmailTemplateData = {
        recipientName: recipient.name,
        subject,
        content,
        functionName: functionDetails?.name,
        functionDate: functionDetails?.date,
        functionLocation: functionDetails?.location,
        senderName: senderDetails.name,
        organisationName: senderDetails.organisationName,
        organisationLogo: senderDetails.organisationLogo,
        ctaButton,
        footer: {
          contactEmail: organiserEmail,
          websiteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://lodgetix.com',
          // TODO: Implement unsubscribe functionality
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(recipient.email)}`,
        },
      };

      // Create React element for HTML content
      const htmlContent = React.createElement(BulkEmailTemplate, templateData) as any;
      const textContent = generateBulkEmailText(templateData);

      return {
        from: FROM_EMAIL,
        to: recipient.email,
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'type', value: 'organiser_bulk' },
          { name: 'organisation', value: senderDetails.organisationName },
          ...(functionDetails ? [{ name: 'function', value: functionDetails.name }] : []),
          ...(recipient.registrationId ? [{ name: 'registration_id', value: recipient.registrationId }] : []),
        ],
      };
    });

    // Send copy to organiser if requested
    if (sendCopyToOrganiser && organiserEmail) {
      const copyTemplateData: BulkEmailTemplateData = {
        recipientName: senderDetails.name,
        subject: `[Copy] ${subject}`,
        content: `This is a copy of the email sent to ${recipients.length} recipient(s).\n\n---\n\n${content}`,
        functionName: functionDetails?.name,
        functionDate: functionDetails?.date,
        functionLocation: functionDetails?.location,
        senderName: senderDetails.name,
        organisationName: senderDetails.organisationName,
        organisationLogo: senderDetails.organisationLogo,
        ctaButton,
        footer: {
          contactEmail: organiserEmail,
          websiteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://lodgetix.com',
        },
      };

      const htmlContent = React.createElement(BulkEmailTemplate, copyTemplateData) as any;
      const textContent = generateBulkEmailText(copyTemplateData);

      batchEmails.push({
        from: FROM_EMAIL,
        to: organiserEmail,
        subject: `[Copy] ${subject}`,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'type', value: 'organiser_bulk_copy' },
          { name: 'organisation', value: senderDetails.organisationName },
        ],
      });
    }

    // Send emails in batches of 100 (Resend's batch limit)
    const batchSize = 100;
    for (let i = 0; i < batchEmails.length; i += batchSize) {
      const batch = batchEmails.slice(i, i + batchSize);
      
      try {
        const batchResult = await getResendClient().batch.send(batch);
        
        // Process batch results
        if (Array.isArray(batchResult.data)) {
          batchResult.data.forEach((emailResult, index) => {
            if (emailResult.id) {
              result.sent++;
            } else {
              result.failed++;
              const originalIndex = i + index;
              if (originalIndex < recipients.length) {
                result.failedEmails?.push(recipients[originalIndex].email);
              }
            }
          });
        }

        // Store the first batch ID for reference
        if (!result.batchId && batchResult.data?.[0]?.id) {
          result.batchId = batchResult.data[0].id;
        }
      } catch (batchError) {
        console.error(`Error sending batch ${i / batchSize + 1}:`, batchError);
        // Mark all emails in this batch as failed
        const batchRecipients = recipients.slice(i, Math.min(i + batchSize, recipients.length));
        result.failed += batchRecipients.length;
        result.failedEmails?.push(...batchRecipients.map(r => r.email));
      }
    }

    return result;
  } catch (error) {
    console.error('Error in sendOrganiserBulkEmail:', error);
    throw error;
  }
}

/**
 * Send a single email from an organiser (for notifications, etc.)
 */
export async function sendOrganiserEmail(
  to: string,
  subject: string,
  templateData: BulkEmailTemplateData
): Promise<{ id: string }> {
  try {
    const htmlContent = React.createElement(BulkEmailTemplate, templateData) as any;
    const textContent = generateBulkEmailText(templateData);

    const result = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'organiser_single' },
        { name: 'organisation', value: templateData.organisationName },
      ],
    });

    return { id: result.id };
  } catch (error) {
    console.error('Error sending organiser email:', error);
    throw error;
  }
}

/**
 * Get email sending statistics for an organisation
 */
export async function getEmailStatistics(organisationName: string) {
  try {
    // Note: Resend API doesn't currently support querying by tags
    // This would need to be implemented with a database to track sent emails
    // For now, return placeholder data
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      lastSentAt: null,
    };
  } catch (error) {
    console.error('Error fetching email statistics:', error);
    throw error;
  }
}