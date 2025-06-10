import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface SupportFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData: SupportFormData = await request.json();

    // Validate required fields
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Prepare email content
    const emailHtml = `
      <h2>New Support Request from LodgeTix</h2>
      <p><strong>From:</strong> ${formData.name} (${formData.email})</p>
      <p><strong>Subject:</strong> ${formData.subject}</p>
      <p><strong>Priority:</strong> ${formData.priority || 'medium'}</p>
      <hr>
      <h3>Message:</h3>
      <p>${formData.message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><em>This message was sent via the LodgeTix support form.</em></p>
    `;

    const emailText = `
New Support Request from LodgeTix

From: ${formData.name} (${formData.email})
Subject: ${formData.subject}
Priority: ${formData.priority || 'medium'}

Message:
${formData.message}

---
This message was sent via the LodgeTix support form.
    `;

    // Call the send-email edge function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'support@lodgetix.io',
        subject: `Support Request: ${formData.subject}`,
        html: emailHtml,
        text: emailText,
        from: 'LodgeTix Support <noreply@lodgetix.io>',
        replyTo: formData.email
      }
    });

    if (error) {
      console.error('Error sending support email:', error);
      return NextResponse.json(
        { error: 'Failed to send support request. Please try again or email support@lodgetix.io directly.' },
        { status: 500 }
      );
    }

    // Log the support request to database (optional - would need to create support_requests table)
    // This helps track support volume and response times
    try {
      await supabase
        .from('support_requests')
        .insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority || 'medium',
          status: 'open',
          email_sent: true
        });
    } catch (dbError) {
      // Log but don't fail the request if database logging fails
      console.warn('Failed to log support request to database:', dbError);
    }

    return NextResponse.json({
      success: true,
      message: 'Support request sent successfully. We will respond within 24 hours.'
    });

  } catch (error) {
    console.error('Support form error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}