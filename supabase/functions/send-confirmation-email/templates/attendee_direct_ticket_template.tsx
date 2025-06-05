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
import { AttendeeEmailData, RegistrationEmailData } from '../types/email.ts'
import { formatDate, formatTime, formatName, formatAddress } from '../utils/formatters.ts'

interface Props {
  data: {
    attendee: AttendeeEmailData
    functionDetails: RegistrationEmailData['functionDetails']
    registrationId: string
    confirmationNumber: string
    registrationType: 'individual' | 'lodge' | 'delegation'
  }
}

export const AttendeeDirectTicketTemplate: React.FC<Props> = ({ data }) => {
  const { attendee, functionDetails, registrationId, confirmationNumber, registrationType } = data
  const attendeeName = formatName(attendee.title, attendee.firstName, attendee.lastName)
  const preview = `Your tickets for ${functionDetails.name}`
  
  return (
    <EmailLayout preview={preview} functionName={functionDetails.name}>
      {/* Personal Greeting */}
      <Section style={greetingSection}>
        <Text style={greeting}>Dear {attendeeName},</Text>
        <Text style={greetingText}>
          Your tickets for {functionDetails.name} are ready! We look forward to seeing you at this special event.
        </Text>
      </Section>

      {/* Event Overview */}
      <Section style={eventOverview}>
        <Row>
          <Column style={eventIcon}>
            <Img
              src="https://lodgetix.com/calendar-icon.png"
              width="40"
              height="40"
              alt="Event"
            />
          </Column>
          <Column style={eventDetails}>
            <Text style={eventName}>{functionDetails.name}</Text>
            <Text style={eventDate}>{functionDetails.dateRange}</Text>
            <Text style={eventLocation}>
              {functionDetails.venueName} • {functionDetails.location}
            </Text>
          </Column>
        </Row>
      </Section>

      <Hr style={divider} />

      {/* Tickets */}
      <Section style={section}>
        <Text style={sectionTitle}>Your Tickets</Text>
        
        {attendee.tickets.map((ticket, index) => (
          <Section key={ticket.id} style={ticketCard}>
            <Row>
              <Column style={ticketInfo}>
                <Text style={ticketEventName}>{ticket.eventName}</Text>
                <Text style={ticketDateTime}>
                  {ticket.eventDate} at {ticket.eventTime}
                </Text>
                <Text style={ticketVenue}>{ticket.venueName}</Text>
                {ticket.tableNumber && (
                  <Text style={ticketDetail}>Table {ticket.tableNumber}</Text>
                )}
                {ticket.seatNumber && (
                  <Text style={ticketDetail}>Seat {ticket.seatNumber}</Text>
                )}
              </Column>
            </Row>
            
            {/* QR Code */}
            {ticket.qrCodeUrl && (
              <Row style={qrCodeRow}>
                <Column align="center">
                  <Img
                    src={ticket.qrCodeUrl}
                    width="150"
                    height="150"
                    alt={`QR Code for ${ticket.eventName}`}
                    style={qrCode}
                  />
                  <Text style={ticketId}>Ticket #{ticket.id.slice(0, 8).toUpperCase()}</Text>
                </Column>
              </Row>
            )}
            
            {index < attendee.tickets.length - 1 && <Hr style={ticketDivider} />}
          </Section>
        ))}
      </Section>

      {/* Partner Information */}
      {attendee.partner && (
        <>
          <Hr style={divider} />
          <Section style={section}>
            <Text style={sectionTitle}>Attending With</Text>
            <Text style={partnerInfo}>
              {formatName(attendee.partner.title, attendee.partner.firstName, attendee.partner.lastName)}
              {' '}(Your {attendee.partner.relationship})
            </Text>
            <Text style={partnerNote}>
              Your partner's ticket is included with yours. Please present both tickets at the event.
            </Text>
          </Section>
        </>
      )}

      {/* Special Requirements */}
      {(attendee.dietaryRequirements || attendee.accessibilityRequirements) && (
        <>
          <Hr style={divider} />
          <Section style={section}>
            <Text style={sectionTitle}>Your Requirements</Text>
            {attendee.dietaryRequirements && (
              <Row style={requirementRow}>
                <Column style={requirementLabel}>Dietary:</Column>
                <Column style={requirementValue}>{attendee.dietaryRequirements}</Column>
              </Row>
            )}
            {attendee.accessibilityRequirements && (
              <Row style={requirementRow}>
                <Column style={requirementLabel}>Accessibility:</Column>
                <Column style={requirementValue}>{attendee.accessibilityRequirements}</Column>
              </Row>
            )}
            <Text style={requirementNote}>
              We have noted your requirements and will ensure they are accommodated.
            </Text>
          </Section>
        </>
      )}

      {/* Action Button */}
      <Section style={buttonSection}>
        <Row>
          <Column align="center">
            <Button
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://lodgetix.com'}/functions/${functionDetails.slug}/register/confirmation/${registrationType}/${confirmationNumber}`}
              style={primaryButton}
            >
              View All Tickets Online
            </Button>
          </Column>
        </Row>
      </Section>

      {/* Important Information */}
      <Section style={infoSection}>
        <Text style={infoTitle}>Event Day Information</Text>
        <Text style={infoText}>
          • Please arrive 15-30 minutes before the event start time
        </Text>
        <Text style={infoText}>
          • Present this email or the QR code at the entrance
        </Text>
        <Text style={infoText}>
          • Dress code: Formal Masonic attire
        </Text>
        <Text style={infoText}>
          • Photography may be taken during the event
        </Text>
      </Section>

      {/* Contact Information */}
      <Section style={contactSection}>
        <Text style={contactTitle}>Need Help?</Text>
        <Text style={contactText}>
          If you have any questions or need to make changes to your booking, 
          please contact us at least 48 hours before the event.
        </Text>
        <Text style={contactText}>
          Confirmation Number: #{confirmationNumber}
        </Text>
      </Section>
    </EmailLayout>
  )
}

// Styles
const greetingSection = {
  padding: '24px 0',
}

const greeting = {
  fontSize: '20px',
  fontWeight: '600',
  color: colors.text,
  margin: '0 0 8px',
}

const greetingText = {
  fontSize: '16px',
  color: colors.lightText,
  margin: '0',
  lineHeight: '24px',
}

const eventOverview = {
  backgroundColor: colors.background,
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
}

const eventIcon = {
  width: '48px',
  paddingRight: '16px',
}

const eventDetails = {
  flex: 1,
}

const eventName = {
  fontSize: '18px',
  fontWeight: '600',
  color: colors.text,
  margin: '0 0 4px',
}

const eventDate = {
  fontSize: '16px',
  color: colors.text,
  margin: '0 0 4px',
}

const eventLocation = {
  fontSize: '14px',
  color: colors.lightText,
  margin: '0',
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

const ticketCard = {
  backgroundColor: colors.white,
  border: `2px solid ${colors.primary}`,
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '16px',
}

const ticketInfo = {
  width: '100%',
}

const ticketEventName = {
  fontSize: '16px',
  fontWeight: '600',
  color: colors.primary,
  margin: '0 0 4px',
}

const ticketDateTime = {
  fontSize: '15px',
  color: colors.text,
  margin: '0 0 4px',
}

const ticketVenue = {
  fontSize: '14px',
  color: colors.lightText,
  margin: '0 0 8px',
}

const ticketDetail = {
  fontSize: '14px',
  color: colors.text,
  margin: '2px 0',
  fontWeight: '500',
}

const qrCodeRow = {
  marginTop: '20px',
}

const qrCode = {
  border: `1px solid ${colors.border}`,
  borderRadius: '4px',
  padding: '8px',
}

const ticketId = {
  fontSize: '12px',
  color: colors.lightText,
  marginTop: '8px',
  textAlign: 'center' as const,
}

const ticketDivider = {
  borderColor: colors.border,
  margin: '20px 0',
}

const divider = {
  borderColor: colors.border,
  margin: '24px 0',
}

const partnerInfo = {
  fontSize: '15px',
  color: colors.text,
  margin: '0 0 8px',
  fontWeight: '500',
}

const partnerNote = {
  fontSize: '14px',
  color: colors.lightText,
  margin: '0',
}

const requirementRow = {
  marginBottom: '8px',
}

const requirementLabel = {
  fontSize: '14px',
  color: colors.lightText,
  width: '100px',
  fontWeight: '500',
}

const requirementValue = {
  fontSize: '14px',
  color: colors.text,
}

const requirementNote = {
  fontSize: '13px',
  color: colors.lightText,
  marginTop: '12px',
  fontStyle: 'italic' as const,
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

const infoSection = {
  backgroundColor: colors.background,
  padding: '20px',
  borderRadius: '8px',
  marginTop: '24px',
}

const infoTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: colors.text,
  margin: '0 0 12px',
}

const infoText = {
  fontSize: '14px',
  color: colors.lightText,
  margin: '4px 0',
  lineHeight: '20px',
}

const contactSection = {
  textAlign: 'center' as const,
  padding: '24px 0',
}

const contactTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: colors.text,
  margin: '0 0 8px',
}

const contactText = {
  fontSize: '14px',
  color: colors.lightText,
  margin: '4px 0',
  lineHeight: '20px',
}