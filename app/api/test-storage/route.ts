import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/lib/services/storage-service';
import { getQRCodeService } from '@/lib/services/qr-code-service';
import { getPDFService } from '@/lib/services/pdf-service';

/**
 * Test endpoint to verify storage services are working
 * This should be removed or secured in production
 */
export async function GET(request: NextRequest) {
  try {
    const results = {
      storage: false,
      qrCode: false,
      pdf: false,
      errors: [] as string[],
    };
    
    // Test storage service
    try {
      const storageService = getStorageService();
      const testPath = `test/test-${Date.now()}.txt`;
      const testContent = new TextEncoder().encode('Test content');
      
      const uploadResult = await storageService.upload({
        bucket: 'email-templates',
        path: testPath,
        file: testContent,
        contentType: 'text/plain',
      });
      
      if (uploadResult) {
        // Clean up test file
        await storageService.delete('email-templates', [testPath]);
        results.storage = true;
      }
    } catch (error) {
      results.errors.push(`Storage test failed: ${error}`);
    }
    
    // Test QR code service
    try {
      const qrCodeService = getQRCodeService();
      const testData = {
        ticketId: 'test-ticket-123',
        registrationId: 'test-reg-123',
        attendeeId: 'test-attendee-123',
        eventId: 'test-event-123',
        ticketType: 'Test',
      };
      
      const dataUrl = await qrCodeService.generateDataUrl(testData);
      if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
        results.qrCode = true;
      }
    } catch (error) {
      results.errors.push(`QR code test failed: ${error}`);
    }
    
    // Test PDF service
    try {
      const pdfService = getPDFService();
      const testTicket = {
        ticketId: 'test-123',
        registrationId: 'reg-123',
        ticketType: 'Test Ticket',
        attendeeId: 'att-123',
        eventId: 'evt-123',
        eventTitle: 'Test Event',
        eventDate: new Date().toLocaleDateString(),
        eventTime: '10:00 AM',
        eventVenue: 'Test Venue',
        eventAddress: '123 Test St',
        attendeeName: 'Test User',
        attendeeType: 'guest' as const,
        confirmationNumber: 'TEST-123',
        purchaseDate: new Date().toLocaleDateString(),
      };
      
      const pdfBlob = await pdfService.generateTicketPDF(testTicket);
      if (pdfBlob && pdfBlob.size > 0) {
        results.pdf = true;
      }
    } catch (error) {
      results.errors.push(`PDF test failed: ${error}`);
    }
    
    const allPassed = results.storage && results.qrCode && results.pdf;
    
    return NextResponse.json({
      success: allPassed,
      message: allPassed ? 'All storage services are working correctly' : 'Some services failed',
      results,
    });
  } catch (error) {
    console.error('Storage test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Storage test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}