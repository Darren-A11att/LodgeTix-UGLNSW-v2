import React from 'react';

export interface EmailTemplateData {
  // Registration details
  confirmationNumber: string;
  registrationDate: string;
  customerName: string;
  customerEmail: string;
  
  // Event details
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventAddress: string;
  
  // Order details
  attendees: Array<{
    name: string;
    type: 'Mason' | 'Guest';
    ticketType: string;
    ticketPrice: number;
  }>;
  
  subtotal: number;
  bookingFee: number;
  total: number;
  
  // Additional info
  dressCode?: string;
  specialInstructions?: string;
  
  // Links
  ticketDownloadUrl: string;
  addToCalendarUrl: string;
}

export const ConfirmationEmailTemplate: React.FC<EmailTemplateData> = ({
  confirmationNumber,
  registrationDate,
  customerName,
  eventTitle,
  eventDate,
  eventTime,
  eventVenue,
  eventAddress,
  attendees,
  subtotal,
  bookingFee,
  total,
  dressCode,
  specialInstructions,
  ticketDownloadUrl,
  addToCalendarUrl,
}) => {
  return (
    <html>
      <head>
        <style>
          {`
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: #0e1f3f; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #0e1f3f; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #0e1f3f; padding-bottom: 10px; }
            .detail-row { margin-bottom: 10px; }
            .label { color: #666; font-weight: bold; display: inline-block; width: 120px; }
            .value { color: #333; }
            .attendee-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .attendee-table th, .attendee-table td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
            .attendee-table th { background-color: #f8f8f8; font-weight: bold; color: #0e1f3f; }
            .total-row { font-weight: bold; font-size: 18px; color: #0e1f3f; }
            .button { display: inline-block; padding: 12px 30px; background-color: #0e1f3f; color: white; text-decoration: none; border-radius: 5px; margin: 10px 10px 10px 0; }
            .button:hover { background-color: #1a2b4f; }
            .footer { background-color: #f8f8f8; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .confirmation-box { background-color: #e8f4fd; border: 2px solid #0e1f3f; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 30px; }
            .confirmation-number { font-size: 24px; font-weight: bold; color: #0e1f3f; }
          `}
        </style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>Registration Confirmation</h1>
          </div>
          
          <div className="content">
            <div className="confirmation-box">
              <p style={{ margin: '0 0 10px 0', color: '#666' }}>Your confirmation number is:</p>
              <div className="confirmation-number">{confirmationNumber}</div>
            </div>
            
            <div className="section">
              <h2>Event Details</h2>
              <div className="detail-row">
                <span className="label">Event:</span>
                <span className="value">{eventTitle}</span>
              </div>
              <div className="detail-row">
                <span className="label">Date:</span>
                <span className="value">{eventDate}</span>
              </div>
              <div className="detail-row">
                <span className="label">Time:</span>
                <span className="value">{eventTime}</span>
              </div>
              <div className="detail-row">
                <span className="label">Venue:</span>
                <span className="value">{eventVenue}</span>
              </div>
              <div className="detail-row">
                <span className="label">Address:</span>
                <span className="value">{eventAddress}</span>
              </div>
              {dressCode && (
                <div className="detail-row">
                  <span className="label">Dress Code:</span>
                  <span className="value">{dressCode}</span>
                </div>
              )}
              {specialInstructions && (
                <div className="detail-row">
                  <span className="label">Instructions:</span>
                  <span className="value">{specialInstructions}</span>
                </div>
              )}
            </div>
            
            <div className="section">
              <h2>Attendee Details</h2>
              <table className="attendee-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Ticket</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((attendee, index) => (
                    <tr key={index}>
                      <td>{attendee.name}</td>
                      <td>{attendee.type}</td>
                      <td>{attendee.ticketType}</td>
                      <td>${attendee.ticketPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right', paddingTop: '10px' }}>
                      <strong>Subtotal:</strong>
                    </td>
                    <td style={{ paddingTop: '10px' }}>${subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right' }}>
                      <strong>Booking Fee:</strong>
                    </td>
                    <td>${bookingFee.toFixed(2)}</td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan={3} style={{ textAlign: 'right', paddingTop: '10px' }}>
                      <strong>Total:</strong>
                    </td>
                    <td style={{ paddingTop: '10px' }}>${total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="section" style={{ textAlign: 'center' }}>
              <h2>Your Tickets</h2>
              <p>Your tickets are attached to this email as a PDF. You can also:</p>
              <a href={ticketDownloadUrl} className="button">Download Tickets</a>
              <a href={addToCalendarUrl} className="button">Add to Calendar</a>
            </div>
            
            <div className="section">
              <h2>Important Information</h2>
              <ul>
                <li>Please bring your tickets (printed or on your mobile device) to the event</li>
                <li>Each ticket contains a unique QR code for entry</li>
                <li>Doors open 30 minutes before the event start time</li>
                <li>This is a non-refundable purchase</li>
              </ul>
            </div>
          </div>
          
          <div className="footer">
            <p>Thank you for your registration!</p>
            <p>If you have any questions, please contact support@lodgetix.com</p>
            <p>&copy; 2025 United Grand Lodge of NSW & ACT. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  );
};

// Text version for email clients that don't support HTML
export const generateTextEmail = (data: EmailTemplateData): string => {
  return `
REGISTRATION CONFIRMATION
========================

Confirmation Number: ${data.confirmationNumber}
Date: ${data.registrationDate}

Dear ${data.customerName},

Thank you for your registration! Here are your event details:

EVENT DETAILS
-------------
Event: ${data.eventTitle}
Date: ${data.eventDate}
Time: ${data.eventTime}
Venue: ${data.eventVenue}
Address: ${data.eventAddress}
${data.dressCode ? `Dress Code: ${data.dressCode}` : ''}
${data.specialInstructions ? `Special Instructions: ${data.specialInstructions}` : ''}

ATTENDEES
---------
${data.attendees.map(a => `${a.name} (${a.type}) - ${a.ticketType}: $${a.ticketPrice.toFixed(2)}`).join('\n')}

ORDER SUMMARY
-------------
Subtotal: $${data.subtotal.toFixed(2)}
Booking Fee: $${data.bookingFee.toFixed(2)}
Total: $${data.total.toFixed(2)}

YOUR TICKETS
------------
Your tickets are attached to this email as a PDF.
Download tickets: ${data.ticketDownloadUrl}
Add to calendar: ${data.addToCalendarUrl}

IMPORTANT INFORMATION
--------------------
- Please bring your tickets (printed or on your mobile device) to the event
- Each ticket contains a unique QR code for entry
- Doors open 30 minutes before the event start time
- This is a non-refundable purchase

If you have any questions, please contact support@lodgetix.com

© 2025 United Grand Lodge of NSW & ACT. All rights reserved.
  `.trim();
};