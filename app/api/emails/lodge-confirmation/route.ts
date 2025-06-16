import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import React from 'react';
import { LodgeConfirmationEmail } from '@/components/emails/lodge-confirmation-email';

// Initialize Resend client lazily
function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('📧 Sending lodge confirmation email for:', data.confirmationNumber);
    console.log('📧 Resend API Key available:', !!process.env.RESEND_API_KEY);
    console.log('📧 Resend API Key prefix:', process.env.RESEND_API_KEY?.substring(0, 8));
    
    // Validate required data
    if (!data.confirmationNumber || !data.billingDetails?.emailAddress || !data.functionData?.name) {
      console.error('❌ Missing required lodge email data');
      return NextResponse.json(
        { success: false, error: 'Missing required lodge email data' },
        { status: 400 }
      );
    }

    // Validate lodge-specific data
    if (!data.lodgeDetails?.lodgeName) {
      console.error('❌ Missing lodge details');
      return NextResponse.json(
        { success: false, error: 'Missing lodge details' },
        { status: 400 }
      );
    }

    // Generate subject line
    const functionName = data.functionData.name;
    const lodgeName = data.lodgeDetails.lodgeName;
    const subject = `Lodge Confirmation ${data.confirmationNumber} - ${functionName}`;

    // Send email using Resend
    const resend = getResendClient();
    const { data: emailResult, error } = await resend.emails.send({
      from: 'LodgeTix <bookings@m.lodgetix.io>',
      to: [data.billingDetails.emailAddress],
      bcc: ['bookings@lodgetix.io'],
      subject: subject,
      react: React.createElement(LodgeConfirmationEmail, data),
    });

    if (error) {
      console.error('❌ Resend error for lodge confirmation:', error);
      
      // Check if it's a rate limit error
      if (error.message?.includes('rate') || error.message?.includes('429')) {
        console.error('⚠️ Resend rate limit exceeded - too many requests');
        return NextResponse.json(
          { success: false, error: 'Email rate limit exceeded. Please try again in a few seconds.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to send lodge confirmation email', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Lodge confirmation email sent successfully:', emailResult.id);
    
    return NextResponse.json({
      success: true,
      emailId: emailResult.id,
      recipient: data.billingDetails.emailAddress,
      lodgeName: lodgeName
    });

  } catch (error: any) {
    console.error('❌ Lodge confirmation email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}