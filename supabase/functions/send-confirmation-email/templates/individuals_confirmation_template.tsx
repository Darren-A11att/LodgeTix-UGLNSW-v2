import React from 'react'
import {
  Text,
  Section,
  Row,
  Column,
  Button,
  Img,
  Hr,
} from '@react-email/components'
import { EmailLayout, colors } from '../components/email_layout.tsx'
import { RegistrationEmailData, AttendeeEmailData } from '../types/email.ts'
import { formatCurrency, formatDate, formatName, formatPhoneNumber } from '../utils/formatters.ts'

interface Props {
  data: RegistrationEmailData & { attendees: AttendeeEmailData[] }
}

export const IndividualConfirmationTemplate: React.FC<Props> = ({ data }) => {
  const preview = `Registration confirmed for ${data.functionDetails.name}`
  
  return (
    <EmailLayout preview={preview} functionName={data.functionDetails.name}>
      {/* Confirmation Header */}
      <Section style={confirmationHeader}>
        <Img
          src="https://lodgetix.com/check-circle.png"
          width="48"
          height="48"
          alt="Success"
          style={successIcon}
        />
        <Text style={confirmationTitle}>Registration Confirmed!</Text>
        <Text style={confirmationText}>
          Thank you for registering for {data.functionDetails.name}. Your registration has been successfully processed.
        </Text>
      </Section>

      {/* Registration Details */}
      <Section style={section}>
        <Text style={sectionTitle}>Registration Details</Text>
        <Row style={detailRow}>
          <Column style={detailLabel}>Confirmation Number:</Column>
          <Column style={detailValue}>#{data.confirmationNumber}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>Event:</Column>
          <Column style={detailValue}>{data.functionDetails.name}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>Dates:</Column>
          <Column style={detailValue}>{data.functionDetails.dateRange}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>Venue:</Column>
          <Column style={detailValue}>
            {data.functionDetails.venueName}<br />
            {data.functionDetails.location}
          </Column>
        </Row>
      </Section>

      <Hr style={divider} />

      {/* Attendee Information */}
      <Section style={section}>
        <Text style={sectionTitle}>Attendee Information</Text>
        {data.attendees.map((attendee, index) => (
          <Section key={attendee.id} style={attendeeCard}>
            <Row>
              <Column style={attendeeInfo}>
                <Text style={attendeeName}>
                  {formatName(attendee.title, attendee.firstName, attendee.lastName)}
                  {attendee.attendeeType === 'mason' && <span style={badge}> Mason</span>}
                </Text>
                {attendee.email && (
                  <Text style={attendeeDetail}>Email: {attendee.email}</Text>
                )}
                {attendee.phone && (
                  <Text style={attendeeDetail}>Phone: {formatPhoneNumber(attendee.phone)}</Text>
                )}
                {attendee.dietaryRequirements && (
                  <Text style={attendeeDetail}>Dietary: {attendee.dietaryRequirements}</Text>
                )}
                {attendee.accessibilityRequirements && (
                  <Text style={attendeeDetail}>Accessibility: {attendee.accessibilityRequirements}</Text>
                )}
              </Column>
            </Row>
            
            {/* Partner Information */}
            {attendee.partner && (
              <Row style={partnerRow}>
                <Column>
                  <Text style={partnerLabel}>Partner:</Text>
                  <Text style={attendeeDetail}>
                    {formatName(attendee.partner.title, attendee.partner.firstName, attendee.partner.lastName)}
                    {' '}({attendee.partner.relationship})
                  </Text>
                </Column>
              </Row>
            )}

            {/* Ticket Information */}
            {attendee.tickets.length > 0 && (
              <Row style={ticketSection}>
                <Column>
                  <Text style={ticketHeader}>Tickets:</Text>
                  {attendee.tickets.map((ticket) => (
                    <Row key={ticket.id} style={ticketRow}>
                      <Column>
                        <Text style={ticketName}>{ticket.eventName}</Text>
                        <Text style={ticketDetail}>
                          {ticket.eventDate} at {ticket.eventTime}
                        </Text>
                        {ticket.tableNumber && (
                          <Text style={ticketDetail}>Table: {ticket.tableNumber}</Text>
                        )}
                      </Column>
                    </Row>
                  ))}
                </Column>
              </Row>
            )}
            
            {index < data.attendees.length - 1 && <Hr style={attendeeDivider} />}
          </Section>
        ))}
      </Section>

      <Hr style={divider} />

      {/* Payment Summary */}
      <Section style={section}>
        <Text style={sectionTitle}>Payment Summary</Text>
        <Row style={detailRow}>
          <Column style={detailLabel}>Subtotal:</Column>
          <Column style={detailValue}>{formatCurrency(data.paymentDetails.subtotal)}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>Processing Fee:</Column>
          <Column style={detailValue}>{formatCurrency(data.paymentDetails.stripeFee)}</Column>
        </Row>
        <Row style={totalRow}>
          <Column style={totalLabel}>Total Paid:</Column>
          <Column style={totalValue}>{formatCurrency(data.paymentDetails.totalAmount)}</Column>
        </Row>
      </Section>

      {/* Contact Information */}
      {data.bookingContact && (
        <>
          <Hr style={divider} />
          <Section style={section}>
            <Text style={sectionTitle}>Booking Contact</Text>
            <Text style={contactInfo}>
              {formatName('', data.bookingContact.firstName, data.bookingContact.lastName)}
              {data.bookingContact.role && ` (${data.bookingContact.role})`}
            </Text>
            <Text style={contactInfo}>{data.bookingContact.email}</Text>
            <Text style={contactInfo}>{formatPhoneNumber(data.bookingContact.phone)}</Text>
          </Section>
        </>
      )}

      {/* Action Buttons */}
      <Section style={buttonSection}>
        <Row>
          <Column align="center">
            <Button
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://lodgetix.com'}/functions/${data.functionDetails.slug}/register/confirmation/individuals/${data.confirmationNumber}`}
              style={primaryButton}
            >
              View Registration Details
            </Button>
          </Column>
        </Row>
        {data.confirmationPdfUrl && (
          <Row style={secondaryButtonRow}>
            <Column align="center">
              <Button
                href={data.confirmationPdfUrl}
                style={secondaryButton}
              >
                Download Confirmation PDF
              </Button>
            </Column>
          </Row>
        )}
      </Section>

      {/* Important Notes */}
      <Section style={notesSection}>
        <Text style={notesTitle}>Important Information</Text>
        <Text style={notesText}>
          • Please bring a copy of this confirmation email or your tickets to the event
        </Text>
        <Text style={notesText}>
          • Tickets will be sent separately to attendees based on their contact preferences
        </Text>
        <Text style={notesText}>
          • For any changes or cancellations, please contact us at least 48 hours before the event
        </Text>
      </Section>
    </EmailLayout>
  )
}

// Styles
const confirmationHeader = {
  textAlign: 'center' as const,
  padding: '24px 0',
}

const successIcon = {
  margin: '0 auto',
}

const confirmationTitle = {
  fontSize: '24px',
  fontWeight: '700',
  color: colors.text,
  margin: '16px 0 8px',
}

const confirmationText = {
  fontSize: '16px',
  color: colors.lightText,
  margin: '0',
  lineHeight: '24px',
}

const section = {
  padding: '24px 0',
}

const sectionTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: colors.text,
  margin: '0 0 16px',
}

const detailRow = {
  marginBottom: '12px',
}

const detailLabel = {
  fontSize: '14px',
  color: colors.lightText,
  width: '140px',
  verticalAlign: 'top' as const,
}

const detailValue = {
  fontSize: '14px',
  color: colors.text,
  fontWeight: '500',
}

const attendeeCard = {
  backgroundColor: colors.background,
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '16px',
}

const attendeeInfo = {
  width: '100%',
}

const attendeeName = {
  fontSize: '16px',
  fontWeight: '600',
  color: colors.text,
  margin: '0 0 8px',
}

const badge = {
  backgroundColor: colors.primary,
  color: colors.white,
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: '500',
  marginLeft: '8px',
}

const attendeeDetail = {
  fontSize: '14px',
  color: colors.lightText,
  margin: '4px 0',
}

const partnerRow = {
  marginTop: '12px',
  paddingTop: '12px',
  borderTop: `1px solid ${colors.border}`,
}

const partnerLabel = {
  fontSize: '14px',
  fontWeight: '500',
  color: colors.text,
  margin: '0 0 4px',
}

const ticketSection = {
  marginTop: '12px',
}

const ticketHeader = {
  fontSize: '14px',
  fontWeight: '500',
  color: colors.text,
  margin: '0 0 8px',
}

const ticketRow = {
  marginBottom: '8px',
}

const ticketName = {
  fontSize: '14px',
  fontWeight: '500',
  color: colors.text,
  margin: '0',
}

const ticketDetail = {
  fontSize: '13px',
  color: colors.lightText,
  margin: '2px 0',
}

const attendeeDivider = {
  borderColor: colors.border,
  margin: '16px 0 0',
}

const divider = {
  borderColor: colors.border,
  margin: '24px 0',
}

const totalRow = {
  marginTop: '12px',
  paddingTop: '12px',
  borderTop: `1px solid ${colors.border}`,
}

const totalLabel = {
  fontSize: '16px',
  fontWeight: '600',
  color: colors.text,
}

const totalValue = {
  fontSize: '16px',
  fontWeight: '700',
  color: colors.primary,
}

const contactInfo = {
  fontSize: '14px',
  color: colors.text,
  margin: '4px 0',
}

const buttonSection = {
  padding: '32px 0',
}

const primaryButton = {
  backgroundColor: colors.primary,
  color: colors.white,
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}

const secondaryButtonRow = {
  marginTop: '12px',
}

const secondaryButton = {
  backgroundColor: colors.white,
  color: colors.primary,
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
  border: `2px solid ${colors.primary}`,
}

const notesSection = {
  backgroundColor: colors.background,
  padding: '20px',
  borderRadius: '8px',
  marginTop: '24px',
}

const notesTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: colors.text,
  margin: '0 0 12px',
}

const notesText = {
  fontSize: '14px',
  color: colors.lightText,
  margin: '4px 0',
  lineHeight: '20px',
}