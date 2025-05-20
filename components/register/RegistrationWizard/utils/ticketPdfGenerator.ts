import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateTicketQRCode, TicketQRData } from './qrCodeGenerator';

export interface TicketData {
  // Ticket details
  ticketId: string;
  registrationId: string;
  ticketType: string;
  attendeeId: string;
  
  // Event details
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventAddress: string;
  
  // Attendee details
  attendeeName: string;
  attendeeType: 'Mason' | 'Guest';
  attendeeTitle?: string;
  
  // Registration details
  confirmationNumber: string;
  purchaseDate: string;
  
  // Additional event info
  dressCode?: string;
  specialInstructions?: string;
}

export const generateTicketPDF = async (ticketData: TicketData): Promise<Blob> => {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Add a page
  const page = pdfDoc.addPage([600, 800]); // Letter size in points
  
  // Get fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const { width, height } = page.getSize();
  
  // Define colors
  const primaryColor = rgb(0.055, 0.125, 0.247); // Masonic blue
  const textColor = rgb(0, 0, 0);
  const grayColor = rgb(0.5, 0.5, 0.5);
  
  // Header background
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: primaryColor,
  });
  
  // Event title
  page.drawText(ticketData.eventTitle, {
    x: 50,
    y: height - 50,
    size: 24,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });
  
  // Event date and time
  page.drawText(`${ticketData.eventDate} at ${ticketData.eventTime}`, {
    x: 50,
    y: height - 80,
    size: 16,
    font: helvetica,
    color: rgb(1, 1, 1),
  });
  
  // Event venue
  page.drawText(ticketData.eventVenue, {
    x: 50,
    y: height - 105,
    size: 14,
    font: helvetica,
    color: rgb(1, 1, 1),
  });
  
  // Main content area
  let yPosition = height - 160;
  
  // Attendee section
  page.drawText('ATTENDEE', {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaBold,
    color: grayColor,
  });
  
  yPosition -= 20;
  
  const attendeeTitle = ticketData.attendeeTitle ? `${ticketData.attendeeTitle} ` : '';
  page.drawText(`${attendeeTitle}${ticketData.attendeeName}`, {
    x: 50,
    y: yPosition,
    size: 18,
    font: helveticaBold,
    color: textColor,
  });
  
  yPosition -= 25;
  
  page.drawText(`Type: ${ticketData.attendeeType} | Ticket: ${ticketData.ticketType}`, {
    x: 50,
    y: yPosition,
    size: 14,
    font: helvetica,
    color: textColor,
  });
  
  yPosition -= 40;
  
  // Venue details
  page.drawText('VENUE', {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaBold,
    color: grayColor,
  });
  
  yPosition -= 20;
  
  page.drawText(ticketData.eventAddress, {
    x: 50,
    y: yPosition,
    size: 14,
    font: helvetica,
    color: textColor,
  });
  
  yPosition -= 40;
  
  // Additional information
  if (ticketData.dressCode) {
    page.drawText('DRESS CODE', {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: grayColor,
    });
    
    yPosition -= 20;
    
    page.drawText(ticketData.dressCode, {
      x: 50,
      y: yPosition,
      size: 14,
      font: helvetica,
      color: textColor,
    });
    
    yPosition -= 40;
  }
  
  if (ticketData.specialInstructions) {
    page.drawText('SPECIAL INSTRUCTIONS', {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: grayColor,
    });
    
    yPosition -= 20;
    
    // Handle multi-line text
    const lines = ticketData.specialInstructions.split('\n');
    for (const line of lines) {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 14,
        font: helvetica,
        color: textColor,
      });
      yPosition -= 20;
    }
    
    yPosition -= 20;
  }
  
  // QR Code section
  const qrData: TicketQRData = {
    ticketId: ticketData.ticketId,
    registrationId: ticketData.registrationId,
    attendeeId: ticketData.attendeeId,
    eventId: ticketData.eventId,
    ticketType: ticketData.ticketType,
  };
  
  const qrCodeDataUrl = await generateTicketQRCode(qrData);
  const qrCodeImage = await pdfDoc.embedPng(qrCodeDataUrl);
  
  // Position QR code on the right side
  const qrSize = 150;
  page.drawImage(qrCodeImage, {
    x: width - qrSize - 50,
    y: height - 290,
    width: qrSize,
    height: qrSize,
  });
  
  // QR code label
  page.drawText('TICKET QR CODE', {
    x: width - qrSize - 50,
    y: height - 310,
    size: 12,
    font: helveticaBold,
    color: grayColor,
  });
  
  // Footer section
  const footerY = 100;
  
  // Divider line
  page.drawLine({
    start: { x: 50, y: footerY + 40 },
    end: { x: width - 50, y: footerY + 40 },
    thickness: 1,
    color: grayColor,
  });
  
  // Confirmation details
  page.drawText('CONFIRMATION', {
    x: 50,
    y: footerY + 20,
    size: 12,
    font: helveticaBold,
    color: grayColor,
  });
  
  page.drawText(`Confirmation #: ${ticketData.confirmationNumber}`, {
    x: 50,
    y: footerY,
    size: 12,
    font: helvetica,
    color: textColor,
  });
  
  page.drawText(`Purchased: ${ticketData.purchaseDate}`, {
    x: 50,
    y: footerY - 20,
    size: 12,
    font: helvetica,
    color: textColor,
  });
  
  // Ticket ID on the right
  page.drawText(`Ticket ID: ${ticketData.ticketId}`, {
    x: width - 200,
    y: footerY,
    size: 10,
    font: helvetica,
    color: grayColor,
  });
  
  // Watermark
  page.drawText('VALID TICKET', {
    x: width / 2 - 100,
    y: height / 2 - 50,
    size: 48,
    font: helveticaBold,
    color: rgb(0.9, 0.9, 0.9),
    opacity: 0.1,
    rotate: { angle: 45, origin: { x: width / 2, y: height / 2 } },
  });
  
  // Serialize the PDFDocument to bytes
  const pdfBytes = await pdfDoc.save();
  
  // Create a Blob from the bytes
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

export const generateAllTicketsPDF = async (tickets: TicketData[]): Promise<Blob> => {
  const pdfDoc = await PDFDocument.create();
  
  // Generate each ticket on a separate page
  for (const ticket of tickets) {
    const ticketPdf = await generateTicketPDF(ticket);
    const ticketPdfBytes = await ticketPdf.arrayBuffer();
    const ticketDoc = await PDFDocument.load(ticketPdfBytes);
    
    // Copy pages from the ticket PDF to the main document
    const [ticketPage] = await pdfDoc.copyPages(ticketDoc, [0]);
    pdfDoc.addPage(ticketPage);
  }
  
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};