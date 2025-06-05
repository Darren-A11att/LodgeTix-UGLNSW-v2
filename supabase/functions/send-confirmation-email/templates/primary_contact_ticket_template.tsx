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
import { formatName, pluralize } from '../utils/formatters.ts'

interface Props {
  data: {
    attendees: AttendeeEmailData[]
    functionDetails: RegistrationEmailData['functionDetails']
    bookingContact: RegistrationEmailData['bookingContact']
    registrationId: string
    confirmationNumber: string
    registrationType: 'individual' | 'lodge' | 'delegation'
    lodgeName?: string
  }
}

export const PrimaryContactTicketTemplate: React.FC<Props> = ({ data }) => {
  const { attendees, functionDetails, bookingContact, registrationId, confirmationNumber, registrationType, lodgeName } = data
  const contactName = bookingContact ? 
    formatName('', bookingContact.firstName, bookingContact.lastName) : 
    'Primary Contact'
  
  const attendeeCount = attendees.length
  const preview = `Action Required: Distribute tickets to ${attendeeCount} ${pluralize(attendeeCount, 'attendee')}`
  
  return (
    <EmailLayout preview={preview} functionName={functionDetails.name}>
      {/* Alert Header */}
      <Section style={alertSection}>
        <Row>
          <Column align="center">
            <Img
              src="https://lodgetix.com/alert-icon.png"
              width="48"
              height="48"
              alt="Action Required"
              style={alertIcon}
            />
          </Column>
        </Row>
        <Text style={alertTitle}>Action Required: Ticket Distribution</Text>
        <Text style={alertText}>
          As the {bookingContact?.role || 'primary contact'} for this {registrationType} registration, 
          you need to distribute tickets to {attendeeCount} {pluralize(attendeeCount, 'attendee')}.
        </Text>
      </Section>

      {/* Registration Summary */}
      <Section style={summarySection}>
        <Text style={sectionTitle}>Registration Summary</Text>
        <Row style={summaryRow}>
          <Column style={summaryLabel}>Event:</Column>
          <Column style={summaryValue}>{functionDetails.name}</Column>
        </Row>
        <Row style={summaryRow}>
          <Column style={summaryLabel}>Dates:</Column>
          <Column style={summaryValue}>{functionDetails.dateRange}</Column>
        </Row>
        {lodgeName && (
          <Row style={summaryRow}>
            <Column style={summaryLabel}>Lodge:</Column>
            <Column style={summaryValue}>{lodgeName}</Column>
          </Row>
        )}
        <Row style={summaryRow}>
          <Column style={summaryLabel}>Total Attendees:</Column>
          <Column style={summaryValue}>
            {attendeeCount} {pluralize(attendeeCount, 'person', 'people')}
          </Column>
        </Row>
      </Section>

      <Hr style={divider} />

      {/* Attendees List */}
      <Section style={section}>
        <Text style={sectionTitle}>Attendees Requiring Tickets</Text>
        <Text style={instructionText}>
          Please forward the appropriate tickets to each attendee listed below:
        </Text>
        
        {attendees.map((attendee, index) => (
          <Section key={attendee.id} style={attendeeCard}>
            <Row>
              <Column style={attendeeNumber}>
                {index + 1}.
              </Column>
              <Column style={attendeeInfo}>
                <Text style={attendeeName}>
                  {formatName(attendee.title, attendee.firstName, attendee.lastName)}
                  {attendee.attendeeType === 'mason' && <span style={badge}> Mason</span>}
                </Text>
                
                {attendee.email && (
                  <Text style={attendeeContact}>
                    <strong>Email:</strong> {attendee.email}
                  </Text>
                )}
                
                {attendee.phone && (
                  <Text style={attendeeContact}>
                    <strong>Phone:</strong> {attendee.phone}
                  </Text>
                )}
                
                {attendee.partner && (
                  <Text style={attendeeNote}>
                    Attending with: {formatName(attendee.partner.title, attendee.partner.firstName, attendee.partner.lastName)} 
                    ({attendee.partner.relationship})
                  </Text>
                )}
                
                <Text style={ticketInfo}>
                  {attendee.tickets.length} {pluralize(attendee.tickets.length, 'ticket')} - 
                  {' '}{attendee.tickets.map(t => t.eventName).join(', ')}
                </Text>
              </Column>
            </Row>
          </Section>
        ))}
      </Section>

      <Hr style={divider} />

      {/* Instructions */}
      <Section style={instructionsSection}>
        <Text style={sectionTitle}>Distribution Instructions</Text>
        <Text style={instructionItem}>
          <strong>1.</strong> Access all tickets online using the button below
        </Text>
        <Text style={instructionItem}>
          <strong>2.</strong> Download or forward each attendee's tickets to them directly
        </Text>
        <Text style={instructionItem}>
          <strong>3.</strong> Confirm with each attendee that they've received their tickets
        </Text>
        <Text style={instructionItem}>
          <strong>4.</strong> Keep a copy of all tickets for your records
        </Text>
      </Section>

      {/* Action Button */}
      <Section style={buttonSection}>
        <Row>
          <Column align="center">
            <Button
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://lodgetix.com'}/functions/${functionDetails.slug}/register/confirmation/${registrationType}/${confirmationNumber}`}
              style={primaryButton}
            >
              Access All Tickets
            </Button>
          </Column>
        </Row>
      </Section>

      {/* Important Notes */}
      <Section style={warningSection}>
        <Text style={warningTitle}>⚠️ Important Reminders</Text>
        <Text style={warningText}>
          • Each attendee must have their ticket (digital or printed) for entry
        </Text>
        <Text style={warningText}>
          • Tickets contain unique QR codes that cannot be duplicated
        </Text>
        <Text style={warningText}>
          • Ensure all attendees receive their tickets at least 24 hours before the event
        </Text>
        <Text style={warningText}>
          • Contact us immediately if any attendee cannot be reached
        </Text>
      </Section>

      {/* Support Section */}
      <Section style={supportSection}>
        <Text style={supportTitle}>Need Assistance?</Text>
        <Text style={supportText}>
          If you have any issues distributing tickets or need help accessing them online, 
          please contact our support team with your confirmation number: 
        </Text>
        <Text style={registrationIdText}>
          #{confirmationNumber}
        </Text>
      </Section>
    </EmailLayout>
  )
}

// Styles
const alertSection = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const alertIcon = {
  margin: '0 auto',
}

const alertTitle = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#d97706',
  margin: '12px 0 8px',
}

const alertText = {
  fontSize: '16px',
  color: '#92400e',
  margin: '0',
  lineHeight: '24px',
}

const summarySection = {
  backgroundColor: colors.background,
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
}

const sectionTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: colors.text,
  margin: '0 0 16px',
}

const summaryRow = {
  marginBottom: '8px',
}

const summaryLabel = {
  fontSize: '14px',
  color: colors.lightText,
  width: '120px',
}

const summaryValue = {
  fontSize: '14px',
  color: colors.text,
  fontWeight: '500',
}

const section = {
  padding: '24px 0',
}

const instructionText = {
  fontSize: '15px',
  color: colors.lightText,
  margin: '0 0 20px',
}

const attendeeCard = {
  backgroundColor: colors.white,
  border: `1px solid ${colors.border}`,
  borderRadius: '6px',
  padding: '16px',
  marginBottom: '12px',
}

const attendeeNumber = {
  width: '30px',
  fontSize: '16px',
  fontWeight: '600',
  color: colors.primary,
}

const attendeeInfo = {
  flex: 1,
}

const attendeeName = {
  fontSize: '16px',
  fontWeight: '600',
  color: colors.text,
  margin: '0 0 6px',
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

const attendeeContact = {
  fontSize: '14px',
  color: colors.text,
  margin: '2px 0',
}

const attendeeNote = {
  fontSize: '13px',
  color: colors.lightText,
  margin: '4px 0',
  fontStyle: 'italic' as const,
}

const ticketInfo = {
  fontSize: '13px',
  color: colors.primary,
  marginTop: '8px',
  fontWeight: '500',
}

const divider = {
  borderColor: colors.border,
  margin: '24px 0',
}

const instructionsSection = {
  backgroundColor: colors.background,
  padding: '20px',
  borderRadius: '8px',
}

const instructionItem = {
  fontSize: '15px',
  color: colors.text,
  margin: '8px 0',
  lineHeight: '22px',
}

const buttonSection = {
  padding: '32px 0',
}

const primaryButton = {
  backgroundColor: colors.primary,
  color: colors.white,
  padding: '14px 32px',
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}

const warningSection = {
  backgroundColor: '#fef3c7',
  padding: '20px',
  borderRadius: '8px',
  marginTop: '24px',
}

const warningTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#d97706',
  margin: '0 0 12px',
}

const warningText = {
  fontSize: '14px',
  color: '#92400e',
  margin: '4px 0',
  lineHeight: '20px',
}

const supportSection = {
  textAlign: 'center' as const,
  padding: '24px 0',
}

const supportTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: colors.text,
  margin: '0 0 8px',
}

const supportText = {
  fontSize: '14px',
  color: colors.lightText,
  margin: '4px 0',
  lineHeight: '20px',
}

const registrationIdText = {
  fontSize: '16px',
  fontWeight: '600',
  color: colors.primary,
  margin: '8px 0',
}