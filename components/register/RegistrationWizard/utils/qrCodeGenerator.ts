import QRCode from 'qrcode';

interface TicketQRData {
  ticketId: string;
  registrationId: string;
  attendeeId: string;
  eventId?: string;
  ticketType?: string;
}

export const generateTicketQRCode = async (ticketData: TicketQRData): Promise<string> => {
  try {
    // Create a unique ticket identifier
    const qrData = JSON.stringify({
      tid: ticketData.ticketId,
      rid: ticketData.registrationId,
      aid: ticketData.attendeeId,
      eid: ticketData.eventId,
      type: ticketData.ticketType,
      timestamp: Date.now(),
      // Add a checksum for validation
      checksum: generateChecksum(ticketData)
    });

    // Generate QR code as data URL
    const qrCodeOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 256,
    };

    const qrCodeUrl = await QRCode.toDataURL(qrData, qrCodeOptions);
    return qrCodeUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('QR code generation failed');
  }
};

// Generate a simple checksum for data integrity
function generateChecksum(data: TicketQRData): string {
  const str = `${data.ticketId}-${data.registrationId}-${data.attendeeId}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// Verify QR code data
export const verifyTicketQRCode = (qrData: string): boolean => {
  try {
    const data = JSON.parse(qrData);
    const expectedChecksum = generateChecksum({
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
};