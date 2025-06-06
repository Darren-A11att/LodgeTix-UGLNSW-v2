import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getStorageService, StorageService } from './storage-service';
import { getQRCodeService, QRCodeService, TicketQRData } from './qr-code-service';

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
  attendeeType: 'mason' | 'guest';
  attendeeTitle?: string;
  
  // Registration details
  confirmationNumber: string;
  purchaseDate: string;
  
  // Additional event info
  dressCode?: string;
  specialInstructions?: string;
}

export interface ConfirmationData {
  registrationId: string;
  confirmationNumber: string;
  customerName: string;
  customerEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventAddress: string;
  attendees: Array<{
    name: string;
    type: string;
    ticketType: string;
    ticketPrice: number;
  }>;
  subtotal: number;
  bookingFee: number;
  total: number;
  purchaseDate: string;
  dressCode?: string;
  specialInstructions?: string;
}

/**
 * Service for generating and managing PDF documents
 */
export class PDFService {
  private storageService: StorageService;
  private qrCodeService: QRCodeService;
  
  // Color constants
  private colors = {
    primary: rgb(0.055, 0.125, 0.247), // Masonic blue
    text: rgb(0, 0, 0),
    gray: rgb(0.5, 0.5, 0.5),
    white: rgb(1, 1, 1),
    lightGray: rgb(0.9, 0.9, 0.9),
  };

  constructor(storageService?: StorageService, qrCodeService?: QRCodeService) {
    this.storageService = storageService || getStorageService();
    this.qrCodeService = qrCodeService || getQRCodeService();
  }

  /**
   * Generate ticket PDF
   */
  async generateTicketPDF(ticketData: TicketData): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]); // Letter size in points
    
    // Embed fonts
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const { width, height } = page.getSize();
    
    // Header background
    page.drawRectangle({
      x: 0,
      y: height - 120,
      width: width,
      height: 120,
      color: this.colors.primary,
    });
    
    // Event title
    page.drawText(ticketData.eventTitle, {
      x: 50,
      y: height - 50,
      size: 24,
      font: helveticaBold,
      color: this.colors.white,
    });
    
    // Event date and time
    page.drawText(`${ticketData.eventDate} at ${ticketData.eventTime}`, {
      x: 50,
      y: height - 80,
      size: 16,
      font: helvetica,
      color: this.colors.white,
    });
    
    // Event venue
    page.drawText(ticketData.eventVenue, {
      x: 50,
      y: height - 105,
      size: 14,
      font: helvetica,
      color: this.colors.white,
    });
    
    // Main content
    let yPosition = height - 160;
    
    // Attendee section
    this.drawSection(page, 'ATTENDEE', 50, yPosition, helveticaBold, this.colors.gray, 12);
    yPosition -= 20;
    
    const attendeeTitle = ticketData.attendeeTitle ? `${ticketData.attendeeTitle} ` : '';
    page.drawText(`${attendeeTitle}${ticketData.attendeeName}`, {
      x: 50,
      y: yPosition,
      size: 18,
      font: helveticaBold,
      color: this.colors.text,
    });
    
    yPosition -= 25;
    
    page.drawText(`Type: ${ticketData.attendeeType} | Ticket: ${ticketData.ticketType}`, {
      x: 50,
      y: yPosition,
      size: 14,
      font: helvetica,
      color: this.colors.text,
    });
    
    yPosition -= 40;
    
    // Venue details
    this.drawSection(page, 'VENUE', 50, yPosition, helveticaBold, this.colors.gray, 12);
    yPosition -= 20;
    
    page.drawText(ticketData.eventAddress, {
      x: 50,
      y: yPosition,
      size: 14,
      font: helvetica,
      color: this.colors.text,
    });
    
    yPosition -= 40;
    
    // Additional information
    if (ticketData.dressCode) {
      this.drawSection(page, 'DRESS CODE', 50, yPosition, helveticaBold, this.colors.gray, 12);
      yPosition -= 20;
      
      page.drawText(ticketData.dressCode, {
        x: 50,
        y: yPosition,
        size: 14,
        font: helvetica,
        color: this.colors.text,
      });
      
      yPosition -= 40;
    }
    
    if (ticketData.specialInstructions) {
      this.drawSection(page, 'SPECIAL INSTRUCTIONS', 50, yPosition, helveticaBold, this.colors.gray, 12);
      yPosition -= 20;
      
      const lines = this.wrapText(ticketData.specialInstructions, 500, helvetica, 14);
      for (const line of lines) {
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 14,
          font: helvetica,
          color: this.colors.text,
        });
        yPosition -= 20;
      }
      
      yPosition -= 20;
    }
    
    // QR Code
    const qrData: TicketQRData = {
      ticketId: ticketData.ticketId,
      registrationId: ticketData.registrationId,
      attendeeId: ticketData.attendeeId,
      eventId: ticketData.eventId,
      ticketType: ticketData.ticketType,
    };
    
    const qrCodeDataUrl = await this.qrCodeService.generateDataUrl(qrData);
    const qrCodeImage = await pdfDoc.embedPng(qrCodeDataUrl);
    
    const qrSize = 150;
    page.drawImage(qrCodeImage, {
      x: width - qrSize - 50,
      y: height - 290,
      width: qrSize,
      height: qrSize,
    });
    
    page.drawText('TICKET QR CODE', {
      x: width - qrSize - 50,
      y: height - 310,
      size: 12,
      font: helveticaBold,
      color: this.colors.gray,
    });
    
    // Footer
    this.drawFooter(page, ticketData, helvetica, helveticaBold);
    
    // Watermark
    this.drawWatermark(page, 'VALID TICKET', helveticaBold);
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  /**
   * Generate confirmation PDF with all ticket details
   */
  async generateConfirmationPDF(confirmationData: ConfirmationData): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const { width, height } = page.getSize();
    
    // Header
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width: width,
      height: 100,
      color: this.colors.primary,
    });
    
    page.drawText('Registration Confirmation', {
      x: 50,
      y: height - 40,
      size: 28,
      font: helveticaBold,
      color: this.colors.white,
    });
    
    page.drawText(`Confirmation #${confirmationData.confirmationNumber}`, {
      x: 50,
      y: height - 70,
      size: 16,
      font: helvetica,
      color: this.colors.white,
    });
    
    let yPosition = height - 130;
    
    // Customer Information
    this.drawSection(page, 'CUSTOMER INFORMATION', 50, yPosition, helveticaBold, this.colors.gray, 14);
    yPosition -= 25;
    
    page.drawText(confirmationData.customerName, {
      x: 50,
      y: yPosition,
      size: 16,
      font: helvetica,
      color: this.colors.text,
    });
    
    yPosition -= 20;
    
    page.drawText(confirmationData.customerEmail, {
      x: 50,
      y: yPosition,
      size: 14,
      font: helvetica,
      color: this.colors.text,
    });
    
    yPosition -= 40;
    
    // Event Information
    this.drawSection(page, 'EVENT INFORMATION', 50, yPosition, helveticaBold, this.colors.gray, 14);
    yPosition -= 25;
    
    page.drawText(confirmationData.eventTitle, {
      x: 50,
      y: yPosition,
      size: 18,
      font: helveticaBold,
      color: this.colors.text,
    });
    
    yPosition -= 25;
    
    page.drawText(`${confirmationData.eventDate} at ${confirmationData.eventTime}`, {
      x: 50,
      y: yPosition,
      size: 14,
      font: helvetica,
      color: this.colors.text,
    });
    
    yPosition -= 20;
    
    page.drawText(confirmationData.eventVenue, {
      x: 50,
      y: yPosition,
      size: 14,
      font: helvetica,
      color: this.colors.text,
    });
    
    yPosition -= 20;
    
    page.drawText(confirmationData.eventAddress, {
      x: 50,
      y: yPosition,
      size: 14,
      font: helvetica,
      color: this.colors.text,
    });
    
    yPosition -= 40;
    
    // Attendees
    this.drawSection(page, 'ATTENDEES', 50, yPosition, helveticaBold, this.colors.gray, 14);
    yPosition -= 25;
    
    for (const attendee of confirmationData.attendees) {
      page.drawText(`${attendee.name} (${attendee.type})`, {
        x: 50,
        y: yPosition,
        size: 14,
        font: helvetica,
        color: this.colors.text,
      });
      
      page.drawText(`${attendee.ticketType} - $${attendee.ticketPrice.toFixed(2)}`, {
        x: 350,
        y: yPosition,
        size: 14,
        font: helvetica,
        color: this.colors.text,
      });
      
      yPosition -= 20;
    }
    
    yPosition -= 20;
    
    // Order Summary
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: this.colors.gray,
    });
    
    yPosition -= 20;
    
    page.drawText('Subtotal:', {
      x: 350,
      y: yPosition,
      size: 14,
      font: helvetica,
      color: this.colors.text,
    });
    
    page.drawText(`$${confirmationData.subtotal.toFixed(2)}`, {
      x: 450,
      y: yPosition,
      size: 14,
      font: helvetica,
      color: this.colors.text,
    });
    
    yPosition -= 20;
    
    page.drawText('Booking Fee:', {
      x: 350,
      y: yPosition,
      size: 14,
      font: helvetica,
      color: this.colors.text,
    });
    
    page.drawText(`$${confirmationData.bookingFee.toFixed(2)}`, {
      x: 450,
      y: yPosition,
      size: 14,
      font: helvetica,
      color: this.colors.text,
    });
    
    yPosition -= 25;
    
    page.drawText('Total:', {
      x: 350,
      y: yPosition,
      size: 16,
      font: helveticaBold,
      color: this.colors.text,
    });
    
    page.drawText(`$${confirmationData.total.toFixed(2)}`, {
      x: 450,
      y: yPosition,
      size: 16,
      font: helveticaBold,
      color: this.colors.text,
    });
    
    // Footer
    const footerY = 50;
    page.drawText(`Purchase Date: ${confirmationData.purchaseDate}`, {
      x: 50,
      y: footerY,
      size: 10,
      font: helvetica,
      color: this.colors.gray,
    });
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  /**
   * Generate and store ticket PDF
   */
  async generateAndStoreTicket(ticketData: TicketData): Promise<string | null> {
    try {
      const pdfBlob = await this.generateTicketPDF(ticketData);
      const buffer = await pdfBlob.arrayBuffer();
      const path = `registrations/${ticketData.registrationId}/tickets/${ticketData.ticketId}.pdf`;
      
      const result = await this.storageService.upload({
        bucket: 'confirmations',
        path,
        file: buffer,
        contentType: 'application/pdf',
        cacheControl: '31536000', // Cache for 1 year
        upsert: true,
      });
      
      if (!result) return null;
      
      // Generate signed URL for private access
      const signedUrl = await this.storageService.getSignedUrl({
        bucket: 'confirmations',
        path,
        expiresIn: 3600, // 1 hour
      });
      
      return signedUrl;
    } catch (error) {
      console.error('Failed to generate and store ticket PDF:', error);
      return null;
    }
  }

  /**
   * Generate and store confirmation PDF
   */
  async generateAndStoreConfirmation(confirmationData: ConfirmationData): Promise<string | null> {
    try {
      const pdfBlob = await this.generateConfirmationPDF(confirmationData);
      const buffer = await pdfBlob.arrayBuffer();
      const timestamp = Date.now();
      const path = `registrations/${confirmationData.registrationId}/confirmation-${timestamp}.pdf`;
      
      const result = await this.storageService.upload({
        bucket: 'confirmations',
        path,
        file: buffer,
        contentType: 'application/pdf',
        cacheControl: '31536000',
        upsert: true,
      });
      
      if (!result) return null;
      
      // Generate signed URL for private access
      const signedUrl = await this.storageService.getSignedUrl({
        bucket: 'confirmations',
        path,
        expiresIn: 3600, // 1 hour
      });
      
      return signedUrl;
    } catch (error) {
      console.error('Failed to generate and store confirmation PDF:', error);
      return null;
    }
  }

  /**
   * Batch generate all tickets for a registration
   */
  async batchGenerateTickets(tickets: TicketData[]): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();
    
    for (const ticket of tickets) {
      const ticketPdf = await this.generateTicketPDF(ticket);
      const ticketPdfBytes = await ticketPdf.arrayBuffer();
      const ticketDoc = await PDFDocument.load(ticketPdfBytes);
      
      const [ticketPage] = await pdfDoc.copyPages(ticketDoc, [0]);
      pdfDoc.addPage(ticketPage);
    }
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  /**
   * Helper: Draw section header
   */
  private drawSection(
    page: any,
    text: string,
    x: number,
    y: number,
    font: any,
    color: any,
    size: number
  ) {
    page.drawText(text, { x, y, size, font, color });
  }

  /**
   * Helper: Draw footer
   */
  private drawFooter(page: any, ticketData: TicketData, helvetica: any, helveticaBold: any) {
    const { width } = page.getSize();
    const footerY = 100;
    
    page.drawLine({
      start: { x: 50, y: footerY + 40 },
      end: { x: width - 50, y: footerY + 40 },
      thickness: 1,
      color: this.colors.gray,
    });
    
    page.drawText('CONFIRMATION', {
      x: 50,
      y: footerY + 20,
      size: 12,
      font: helveticaBold,
      color: this.colors.gray,
    });
    
    page.drawText(`Confirmation #: ${ticketData.confirmationNumber}`, {
      x: 50,
      y: footerY,
      size: 12,
      font: helvetica,
      color: this.colors.text,
    });
    
    page.drawText(`Purchased: ${ticketData.purchaseDate}`, {
      x: 50,
      y: footerY - 20,
      size: 12,
      font: helvetica,
      color: this.colors.text,
    });
    
    page.drawText(`Ticket ID: ${ticketData.ticketId}`, {
      x: width - 200,
      y: footerY,
      size: 10,
      font: helvetica,
      color: this.colors.gray,
    });
  }

  /**
   * Helper: Draw watermark
   */
  private drawWatermark(page: any, text: string, font: any) {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 2 - 100,
      y: height / 2 - 50,
      size: 48,
      font,
      color: this.colors.lightGray,
      opacity: 0.1,
      rotate: { angle: 45, origin: { x: width / 2, y: height / 2 } },
    });
  }

  /**
   * Helper: Wrap text to fit width
   */
  private wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
}

// Singleton instance
let pdfService: PDFService | null = null;

export function getPDFService(): PDFService {
  if (!pdfService) {
    pdfService = new PDFService();
  }
  return pdfService;
}