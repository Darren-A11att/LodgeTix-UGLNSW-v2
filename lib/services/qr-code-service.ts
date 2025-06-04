import QRCode from 'qrcode';
import { getStorageService, StorageService } from './storage-service';

export interface TicketQRData {
  ticketId: string;
  registrationId: string;
  attendeeId: string;
  eventId?: string;
  ticketType?: string;
}

export interface TicketQRDataV2 {
  type: 'TICKET';
  fid: string; // function_id
  tid: string; // ticket_id
  rid: string; // registration_id
  ttid: string; // ticket_type_id
  pid: string | null; // package_id
  tca: string; // ticket created_at
  qca: string; // qr code created_at
  spi: string | null; // stripe_payment_intent_id
  rt: string | null; // registration_type
  uid: string | null; // auth_user_id
  fn: string; // function_name
  en: string; // event_name
  checksum: string;
}

export interface AttendeeQRData {
  type: 'ATTENDEE';
  fid: string; // function_id
  aid: string; // attendee_id
  rid: string; // registration_id
  qca: string; // qr code created_at
  spi: string | null; // stripe_payment_intent_id
  rt: string | null; // registration_type
  uid: string | null; // auth_user_id
  fn: string; // function_name
  checksum: string;
}

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Service for generating and managing QR codes for tickets
 */
export class QRCodeService {
  private storageService: StorageService;
  private defaultOptions: Required<QRCodeOptions> = {
    size: 256,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  };

  constructor(storageService?: StorageService) {
    this.storageService = storageService || getStorageService();
  }

  /**
   * Generate QR code data string with validation checksum
   */
  private generateQRData(ticketData: TicketQRData): string {
    const qrData = {
      tid: ticketData.ticketId,
      rid: ticketData.registrationId,
      aid: ticketData.attendeeId,
      eid: ticketData.eventId,
      type: ticketData.ticketType,
      timestamp: Date.now(),
      checksum: this.generateChecksum(ticketData),
    };
    
    return JSON.stringify(qrData);
  }

  /**
   * Generate a simple checksum for data integrity
   */
  private generateChecksum(data: TicketQRData): string {
    const str = `${data.ticketId}-${data.registrationId}-${data.attendeeId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Generate SHA-256 checksum for V2 QR data
   */
  private async generateChecksumV2(data: any): Promise<string> {
    const dataForChecksum = JSON.stringify({
      ...data,
      checksum: undefined
    });
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataForChecksum);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Parse QR code data and determine version
   */
  static parseQRCode(qrData: string): TicketQRData | TicketQRDataV2 | AttendeeQRData {
    try {
      const parsed = JSON.parse(qrData);
      
      // Check if it's V2 format (has 'type' field)
      if (parsed.type) {
        return parsed as TicketQRDataV2 | AttendeeQRData;
      }
      
      // Otherwise it's V1 format, convert to interface
      return {
        ticketId: parsed.tid,
        registrationId: parsed.rid,
        attendeeId: parsed.aid,
        eventId: parsed.eid,
        ticketType: parsed.type
      } as TicketQRData;
    } catch (error) {
      throw new Error('Invalid QR code data');
    }
  }

  /**
   * Generate QR code as data URL
   */
  async generateDataUrl(ticketData: TicketQRData, options?: QRCodeOptions): Promise<string> {
    try {
      const qrData = this.generateQRData(ticketData);
      const mergedOptions = { ...this.defaultOptions, ...options };
      
      const qrCodeOptions = {
        errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
        type: 'image/png' as const,
        quality: 0.92,
        margin: mergedOptions.margin,
        color: mergedOptions.color,
        width: mergedOptions.size,
      };

      const qrCodeUrl = await QRCode.toDataURL(qrData, qrCodeOptions);
      return qrCodeUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw new Error('QR code generation failed');
    }
  }

  /**
   * Generate QR code as Buffer
   */
  async generateBuffer(ticketData: TicketQRData, options?: QRCodeOptions): Promise<Buffer> {
    try {
      const qrData = this.generateQRData(ticketData);
      const mergedOptions = { ...this.defaultOptions, ...options };
      
      const qrCodeOptions = {
        errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
        type: 'png' as const,
        margin: mergedOptions.margin,
        color: mergedOptions.color,
        width: mergedOptions.size,
      };

      const buffer = await QRCode.toBuffer(qrData, qrCodeOptions);
      return buffer;
    } catch (error) {
      console.error('Failed to generate QR code buffer:', error);
      throw new Error('QR code generation failed');
    }
  }

  /**
   * Generate and store QR code in Supabase storage
   */
  async generateAndStore(ticketData: TicketQRData, options?: QRCodeOptions): Promise<string | null> {
    try {
      const buffer = await this.generateBuffer(ticketData, options);
      const path = `registrations/${ticketData.registrationId}/tickets/${ticketData.ticketId}.png`;
      
      const result = await this.storageService.upload({
        bucket: 'ticket-qr-codes',
        path,
        file: buffer,
        contentType: 'image/png',
        cacheControl: '31536000', // Cache for 1 year
        upsert: true,
      });

      return result?.url || null;
    } catch (error) {
      console.error('Failed to generate and store QR code:', error);
      return null;
    }
  }

  /**
   * Get stored QR code URL or generate if not exists
   */
  async getOrGenerateQRCode(ticketData: TicketQRData, options?: QRCodeOptions): Promise<string | null> {
    try {
      const path = `registrations/${ticketData.registrationId}/tickets/${ticketData.ticketId}.png`;
      
      // Check if QR code already exists
      const exists = await this.storageService.exists('ticket-qr-codes', path);
      
      if (exists) {
        // Return public URL for existing QR code
        return this.storageService.getPublicUrl('ticket-qr-codes', path);
      }
      
      // Generate and store new QR code
      return await this.generateAndStore(ticketData, options);
    } catch (error) {
      console.error('Failed to get or generate QR code:', error);
      return null;
    }
  }

  /**
   * Batch generate QR codes for multiple tickets
   */
  async batchGenerate(tickets: TicketQRData[], options?: QRCodeOptions): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // Process in parallel with concurrency limit
    const concurrencyLimit = 5;
    const chunks = [];
    
    for (let i = 0; i < tickets.length; i += concurrencyLimit) {
      chunks.push(tickets.slice(i, i + concurrencyLimit));
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (ticket) => {
        const url = await this.getOrGenerateQRCode(ticket, options);
        if (url) {
          results.set(ticket.ticketId, url);
        }
      });
      
      await Promise.all(promises);
    }
    
    return results;
  }

  /**
   * Verify QR code data integrity
   */
  verifyQRCode(qrData: string): boolean {
    try {
      const data = JSON.parse(qrData);
      const expectedChecksum = this.generateChecksum({
        ticketId: data.tid,
        registrationId: data.rid,
        attendeeId: data.aid,
        eventId: data.eid,
        ticketType: data.type,
      });
      return data.checksum === expectedChecksum;
    } catch {
      return false;
    }
  }

  /**
   * Delete QR code from storage
   */
  async deleteQRCode(registrationId: string, ticketId: string): Promise<boolean> {
    const path = `registrations/${registrationId}/tickets/${ticketId}.png`;
    return await this.storageService.delete('ticket-qr-codes', [path]);
  }

  /**
   * Clean up old QR codes
   */
  async cleanupOldQRCodes(maxAgeInDays: number = 30): Promise<number> {
    return await this.storageService.cleanupOldFiles('ticket-qr-codes', 'registrations', maxAgeInDays);
  }
}

// Singleton instance
let qrCodeService: QRCodeService | null = null;

export function getQRCodeService(): QRCodeService {
  if (!qrCodeService) {
    qrCodeService = new QRCodeService();
  }
  return qrCodeService;
}