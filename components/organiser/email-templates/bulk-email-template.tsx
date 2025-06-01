import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Preview,
  Section,
  Text,
  Button,
  Heading,
  Hr,
  Img,
  Link,
} from '@react-email/components';

export interface BulkEmailTemplateData {
  recipientName: string;
  subject: string;
  content: string;
  functionName?: string;
  functionDate?: string;
  functionLocation?: string;
  senderName: string;
  organisationName: string;
  organisationLogo?: string;
  ctaButton?: {
    text: string;
    url: string;
  };
  footer?: {
    unsubscribeUrl?: string;
    contactEmail?: string;
    websiteUrl?: string;
  };
}

export const BulkEmailTemplate: React.FC<BulkEmailTemplateData> = ({
  recipientName,
  subject,
  content,
  functionName,
  functionDate,
  functionLocation,
  senderName,
  organisationName,
  organisationLogo,
  ctaButton,
  footer = {},
}) => {
  const previewText = subject || 'Important update from ' + organisationName;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            {organisationLogo ? (
              <Img
                src={organisationLogo}
                width="150"
                height="50"
                alt={organisationName}
                style={logo}
              />
            ) : (
              <Heading style={h1}>{organisationName}</Heading>
            )}
          </Section>

          {/* Main Content */}
          <Section style={content_section}>
            <Text style={greeting}>Dear {recipientName},</Text>
            
            {/* Function Details Banner if provided */}
            {functionName && (
              <Section style={eventBanner}>
                <Heading as="h2" style={h2}>{functionName}</Heading>
                {functionDate && <Text style={eventDetail}>📅 {functionDate}</Text>}
                {functionLocation && <Text style={eventDetail}>📍 {functionLocation}</Text>}
              </Section>
            )}

            {/* Main Message Content */}
            <div dangerouslySetInnerHTML={{ __html: formatContent(content) }} />

            {/* CTA Button if provided */}
            {ctaButton && (
              <Section style={buttonContainer}>
                <Button style={button} href={ctaButton.url}>
                  {ctaButton.text}
                </Button>
              </Section>
            )}

            <Text style={signature}>
              Best regards,<br />
              {senderName}<br />
              {organisationName}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer_section}>
            <Text style={footer_text}>
              This email was sent to {recipientName} regarding your registration with {organisationName}.
            </Text>
            
            {footer.contactEmail && (
              <Text style={footer_text}>
                Questions? Contact us at{' '}
                <Link href={`mailto:${footer.contactEmail}`} style={link}>
                  {footer.contactEmail}
                </Link>
              </Text>
            )}

            {footer.websiteUrl && (
              <Text style={footer_text}>
                Visit our website:{' '}
                <Link href={footer.websiteUrl} style={link}>
                  {footer.websiteUrl}
                </Link>
              </Text>
            )}

            {footer.unsubscribeUrl && (
              <Text style={footer_text}>
                <Link href={footer.unsubscribeUrl} style={unsubscribe}>
                  Unsubscribe from these emails
                </Link>
              </Text>
            )}

            <Text style={copyright}>
              © {new Date().getFullYear()} {organisationName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Helper function to format content with basic HTML support
function formatContent(content: string): string {
  // Convert line breaks to <br> tags
  let formatted = content.replace(/\n/g, '<br />');
  
  // Wrap paragraphs in <p> tags if they're separated by double line breaks
  formatted = formatted.replace(/(<br \/>){2,}/g, '</p><p style="' + textToStyle(text) + '">');
  
  // Wrap in initial paragraph tags
  formatted = `<p style="${textToStyle(text)}">${formatted}</p>`;
  
  return formatted;
}

// Convert style object to inline style string
function textToStyle(styleObj: React.CSSProperties): string {
  return Object.entries(styleObj)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ');
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
};

const header = {
  padding: '32px 32px 24px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e6ebf1',
};

const logo = {
  margin: '0 auto',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  padding: '0',
};

const content_section = {
  padding: '32px',
};

const greeting = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '24px',
};

const eventBanner = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const eventDetail = {
  color: '#666',
  fontSize: '14px',
  margin: '4px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const signature = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  marginTop: '32px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer_section = {
  padding: '32px',
  textAlign: 'center' as const,
};

const footer_text = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  marginBottom: '8px',
};

const link = {
  color: '#5469d4',
  textDecoration: 'underline',
};

const unsubscribe = {
  color: '#8898aa',
  textDecoration: 'underline',
  fontSize: '12px',
};

const copyright = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  marginTop: '16px',
};

// Export a function to generate plain text version
export function generateBulkEmailText(data: BulkEmailTemplateData): string {
  const { 
    recipientName, 
    content, 
    functionName, 
    functionDate, 
    functionLocation,
    senderName,
    organisationName,
    ctaButton,
    footer = {}
  } = data;
  
  let text = `Dear ${recipientName},\n\n`;
  
  if (functionName) {
    text += `${functionName}\n`;
    if (functionDate) text += `Date: ${functionDate}\n`;
    if (functionLocation) text += `Location: ${functionLocation}\n`;
    text += '\n';
  }
  
  text += `${content}\n\n`;
  
  if (ctaButton) {
    text += `${ctaButton.text}: ${ctaButton.url}\n\n`;
  }
  
  text += `Best regards,\n${senderName}\n${organisationName}\n\n`;
  
  text += '---\n';
  text += `This email was sent to ${recipientName} regarding your registration with ${organisationName}.\n`;
  
  if (footer.contactEmail) {
    text += `Questions? Contact us at ${footer.contactEmail}\n`;
  }
  
  if (footer.websiteUrl) {
    text += `Visit our website: ${footer.websiteUrl}\n`;
  }
  
  if (footer.unsubscribeUrl) {
    text += `\nUnsubscribe: ${footer.unsubscribeUrl}\n`;
  }
  
  text += `\n© ${new Date().getFullYear()} ${organisationName}. All rights reserved.`;
  
  return text;
}

export default BulkEmailTemplate;