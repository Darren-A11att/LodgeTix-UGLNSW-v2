import React from 'react';
import { ConfirmationEmailTemplate, EmailTemplateData } from '@/components/register/RegistrationWizard/utils/emailTemplate';

export async function renderEmailTemplate(templateData: EmailTemplateData): Promise<string> {
  // In Next.js 15 App Directory, we don't need renderToStaticMarkup
  // The component is already rendered as a server component
  const element = <ConfirmationEmailTemplate templateData={templateData} />;
  
  // Convert React element to string - this will be handled by the Resend library
  return element as any;
}