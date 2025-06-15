import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import React from 'react';
import { IndividualConfirmationEmail } from '@/components/emails/individual-confirmation-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('📧 Sending individual confirmation email for:', data.confirmationNumber);
    
    // Validate required data
    if (!data.confirmationNumber || !data.billingDetails?.emailAddress || !data.functionData?.name) {
      console.error('❌ Missing required email data');
      return NextResponse.json(
        { success: false, error: 'Missing required email data' },
        { status: 400 }
      );
    }

    // Generate subject line
    const functionName = data.functionData.name;
    const organiserName = data.functionData.organiser?.name || 'United Grand Lodge of NSW & ACT';
    const subject = `Confirmation Code - ${functionName} ${organiserName}`;

    // Send email using Resend
    const { data: emailResult, error } = await resend.emails.send({
      from: 'LodgeTix <bookings@m.lodgetix.io>',
      to: [data.billingDetails.emailAddress],
      bcc: ['bookings@lodgetix.io'],
      subject: subject,
      react: React.createElement(IndividualConfirmationEmail, data),
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log('✅ Email sent successfully:', emailResult.id);
    
    return NextResponse.json({
      success: true,
      emailId: emailResult.id,
      recipient: data.billingDetails.emailAddress
    });

  } catch (error: any) {
    console.error('❌ Email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}