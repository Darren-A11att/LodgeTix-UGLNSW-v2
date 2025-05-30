import { NextRequest, NextResponse } from 'next/server';
import { getPostPaymentService } from '@/lib/services/post-payment-service';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: registrationId } = await params;
    
    // Get registration to verify it exists and is paid
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('payment_status, confirmation_number')
      .eq('registration_id', registrationId)
      .single();
    
    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }
    
    // Check if payment is completed
    if (registration.payment_status !== 'completed') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { sendEmail = true } = body;
    
    const postPaymentService = getPostPaymentService();
    const result = await postPaymentService.processPostPayment({
      registrationId,
      confirmationNumber: registration.confirmation_number || `REG-${registrationId.substring(0, 8).toUpperCase()}`,
      sendEmail,
    });
    
    if (!result.success) {
      console.error('Post-payment processing errors:', result.errors);
      return NextResponse.json(
        { 
          error: 'Post-payment processing failed',
          details: result.errors,
          partial: {
            qrCodesGenerated: result.qrCodesGenerated,
            pdfsGenerated: result.pdfsGenerated,
            emailsSent: result.emailsSent,
          }
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      registrationId,
      qrCodesGenerated: result.qrCodesGenerated,
      pdfsGenerated: result.pdfsGenerated,
      emailsSent: result.emailsSent,
      message: 'Post-payment processing completed successfully',
    });
  } catch (error) {
    console.error('Error in post-payment processing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: registrationId } = await params;
    
    // Get registration with tickets to check asset status
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        payment_status,
        confirmation_pdf_url,
        tickets (
          id,
          qr_code_url
        )
      `)
      .eq('registration_id', registrationId)
      .single();
    
    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }
    
    const ticketsWithQR = registration.tickets.filter((t: any) => t.qr_code_url).length;
    const totalTickets = registration.tickets.length;
    
    return NextResponse.json({
      success: true,
      registrationId,
      paymentStatus: registration.payment_status,
      assets: {
        confirmationPDF: !!registration.confirmation_pdf_url,
        qrCodes: {
          generated: ticketsWithQR,
          total: totalTickets,
          complete: ticketsWithQR === totalTickets,
        },
      },
      requiresProcessing: registration.payment_status === 'completed' && 
        (!registration.confirmation_pdf_url || ticketsWithQR < totalTickets),
    });
  } catch (error) {
    console.error('Error checking post-payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}