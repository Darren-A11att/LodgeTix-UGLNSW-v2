import { Resend } from 'resend';
import { EmailTemplateData, ConfirmationEmailTemplate, generateTextEmail } from './emailTemplate';
import React from 'react';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendConfirmationEmailOptions {
  to: string;
  templateData: EmailTemplateData;
  attachments?: EmailAttachment[];
}

export interface BatchEmailRecipient {
  email: string;
  attendeeId: string;
  attendeeName: string;
  ticketBlob: Blob;
}

export interface SendBatchConfirmationEmailsOptions {
  recipients: BatchEmailRecipient[];
  baseTemplateData: Omit<EmailTemplateData, 'customerName' | 'customerEmail' | 'attendees'>;
  registrationAttendees: EmailTemplateData['attendees'];
}

export const sendConfirmationEmail = async ({
  to,
  templateData,
  attachments = [],
}: SendConfirmationEmailOptions) => {
  try {
    // Create React element - Resend can handle React components directly
    const htmlContent = React.createElement(ConfirmationEmailTemplate, templateData) as any;
    
    // Generate text version
    const textContent = generateTextEmail(templateData);
    
    // Send email via Resend
    const result = await resend.emails.send({
      from: 'LodgeTix <noreply@lodgetix.com>',
      to,
      subject: `Registration Confirmation - ${templateData.eventTitle}`,
      html: htmlContent,
      text: textContent,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        type: att.contentType,
      })),
      tags: [
        { name: 'event_id', value: templateData.confirmationNumber },
        { name: 'type', value: 'confirmation' },
      ],
    });
    
    return result;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
};

// Send batch confirmation emails to all attendees
export const sendBatchConfirmationEmails = async ({
  recipients,
  baseTemplateData,
  registrationAttendees,
}: SendBatchConfirmationEmailsOptions) => {
  try {
    const batchEmails = await Promise.all(
      recipients.map(async (recipient) => {
        // Prepare individual ticket attachment
        const ticketAttachment = await prepareTicketAttachment(
          recipient.ticketBlob,
          `ticket-${recipient.attendeeId}.pdf`
        );
        
        // Create individual template data
        const individualTemplateData: EmailTemplateData = {
          ...baseTemplateData,
          customerName: recipient.attendeeName,
          customerEmail: recipient.email,
          attendees: registrationAttendees, // Show all attendees in the registration
        };
        
        // Create React element - Resend can handle React components directly
        const htmlContent = React.createElement(ConfirmationEmailTemplate, individualTemplateData) as any;
        const textContent = generateTextEmail(individualTemplateData);
        
        return {
          from: 'LodgeTix <noreply@lodgetix.com>',
          to: recipient.email,
          subject: `Your Ticket - ${baseTemplateData.eventTitle}`,
          html: htmlContent,
          text: textContent,
          attachments: [{
            filename: ticketAttachment.filename,
            content: ticketAttachment.content,
            type: ticketAttachment.contentType,
          }],
          tags: [
            { name: 'event_id', value: baseTemplateData.confirmationNumber },
            { name: 'attendee_id', value: recipient.attendeeId },
            { name: 'type', value: 'individual_ticket' },
          ],
        };
      })
    );
    
    // Send all emails in a batch
    const result = await resend.batch.send(batchEmails);
    return result;
  } catch (error) {
    console.error('Error sending batch confirmation emails:', error);
    throw error;
  }
};

// Helper function to prepare ticket PDF attachment
export const prepareTicketAttachment = async (
  pdfBlob: Blob,
  filename = 'tickets.pdf'
): Promise<EmailAttachment> => {
  const buffer = await pdfBlob.arrayBuffer();
  return {
    filename,
    content: Buffer.from(buffer),
    contentType: 'application/pdf',
  };
};