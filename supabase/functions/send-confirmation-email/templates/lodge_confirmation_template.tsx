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
import { LodgeEmailData, AttendeeEmailData } from '../types/email.ts'
import { formatCurrency, formatDate, formatName, formatPhoneNumber, pluralize } from '../utils/formatters.ts'

interface Props {
  data: LodgeEmailData
}

export const LodgeConfirmationTemplate: React.FC<Props> = ({ data }) => {
  const preview = `Lodge registration confirmed for ${data.lodgeDetails.name} - ${data.functionDetails.name}`
  
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
        <Text style={confirmationTitle}>Lodge Registration Confirmed!</Text>
        <Text style={confirmationText}>
          Thank you for registering {data.lodgeDetails.name} for {data.functionDetails.name}. 
          Your registration has been successfully processed.
        </Text>
      </Section>

      {/* Lodge Details */}
      <Section style={section}>
        <Text style={sectionTitle}>Lodge Information</Text>
        <Row style={detailRow}>
          <Column style={detailLabel}>Lodge Name:</Column>
          <Column style={detailValue}>{data.lodgeDetails.name}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>Lodge Number:</Column>
          <Column style={detailValue}>#{data.lodgeDetails.number}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>Grand Lodge:</Column>
          <Column style={detailValue}>{data.lodgeDetails.grandLodge}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>Confirmation Number:</Column>
          <Column style={detailValue}>#{data.confirmationNumber}</Column>
        </Row>
      </Section>

      <Hr style={divider} />

      {/* Event Details */}
      <Section style={section}>
        <Text style={sectionTitle}>Event Details</Text>
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

      {/* Package Details */}
      <Section style={section}>
        <Text style={sectionTitle}>Package Details</Text>
        <Section style={packageCard}>
          <Text style={packageName}>{data.packageDetails.name}</Text>
          <Text style={packageDescription}>{data.packageDetails.description}</Text>
          <Row style={packageDetailRow}>
            <Column style={detailLabel}>Attendees:</Column>
            <Column style={detailValue}>
              {data.packageDetails.attendeeCount} {pluralize(data.packageDetails.attendeeCount, 'person', 'people')}
            </Column>
          </Row>
          <Row style={packageDetailRow}>
            <Column style={detailLabel}>Price per person:</Column>
            <Column style={detailValue}>{formatCurrency(data.packageDetails.pricePerPerson)}</Column>
          </Row>
          <Row style={packageTotalRow}>
            <Column style={totalLabel}>Package Total:</Column>
            <Column style={totalValue}>{formatCurrency(data.packageDetails.totalPrice)}</Column>
          </Row>
        </Section>
      </Section>

      <Hr style={divider} />

      {/* Lodge Members */}
      <Section style={section}>
        <Text style={sectionTitle}>Lodge Members ({data.attendees.length})</Text>
        <Section style={membersTable}>
          {data.attendees.map((member, index) => (
            <Row key={member.id} style={memberRow}>
              <Column style={memberInfo}>
                <Text style={memberName}>
                  {formatName(member.title, member.firstName, member.lastName)}
                  {member.attendeeType === 'mason' && <span style={badge}> Mason</span>}
                </Text>
                {member.email && (
                  <Text style={memberDetail}>{member.email}</Text>
                )}
                {member.partner && (
                  <Text style={memberDetail}>
                    Partner: {formatName(member.partner.title, member.partner.firstName, member.partner.lastName)}
                  </Text>
                )}
                {(member.dietaryRequirements || member.accessibilityRequirements) && (
                  <Text style={memberNote}>
                    {[member.dietaryRequirements, member.accessibilityRequirements]
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                )}
              </Column>
              <Column style={ticketCount}>
                {member.tickets.length} {pluralize(member.tickets.length, 'ticket')}
              </Column>
            </Row>
          ))}
        </Section>
      </Section>

      <Hr style={divider} />

      {/* Booking Contact */}
      {data.bookingContact && (
        <>
          <Section style={section}>
            <Text style={sectionTitle}>Booking Contact</Text>
            <Section style={contactCard}>
              <Text style={contactName}>
                {formatName('', data.bookingContact.firstName, data.bookingContact.lastName)}
                {data.bookingContact.role && ` - ${data.bookingContact.role}`}
              </Text>
              <Text style={contactDetail}>{data.bookingContact.email}</Text>
              <Text style={contactDetail}>{formatPhoneNumber(data.bookingContact.phone)}</Text>
            </Section>
          </Section>
          <Hr style={divider} />
        </>
      )}

      {/* Payment Summary */}
      <Section style={section}>
        <Text style={sectionTitle}>Payment Summary</Text>
        <Row style={detailRow}>
          <Column style={detailLabel}>Package Total:</Column>
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

      {/* Action Buttons */}
      <Section style={buttonSection}>
        <Row>
          <Column align="center">
            <Button
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://lodgetix.com'}/functions/${data.functionDetails.slug}/register/confirmation/lodge/${data.confirmationNumber}`}
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
        <Text style={notesTitle}>Next Steps</Text>
        <Text style={notesText}>
          • Individual tickets will be sent to each attendee based on their contact preferences
        </Text>
        <Text style={notesText}>
          • The booking contact will receive tickets for members who selected "primary contact" preference
        </Text>
        <Text style={notesText}>
          • You can manage your registration and attendees through your customer portal
        </Text>
        <Text style={notesText}>
          • For any changes or special requirements, please contact us at least 48 hours before the event
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

const packageCard = {
  backgroundColor: colors.background,
  padding: '20px',
  borderRadius: '8px',
}

const packageName = {
  fontSize: '18px',
  fontWeight: '600',
  color: colors.text,
  margin: '0 0 8px',
}

const packageDescription = {
  fontSize: '14px',
  color: colors.lightText,
  margin: '0 0 16px',
  lineHeight: '20px',
}

const packageDetailRow = {
  marginBottom: '8px',
}

const packageTotalRow = {
  marginTop: '12px',
  paddingTop: '12px',
  borderTop: `1px solid ${colors.border}`,
}

const membersTable = {
  backgroundColor: colors.white,
  border: `1px solid ${colors.border}`,
  borderRadius: '8px',
  overflow: 'hidden',
}

const memberRow = {
  padding: '16px',
  borderBottom: `1px solid ${colors.border}`,
}

const memberInfo = {
  flex: 1,
}

const memberName = {
  fontSize: '15px',
  fontWeight: '600',
  color: colors.text,
  margin: '0 0 4px',
}

const memberDetail = {
  fontSize: '14px',
  color: colors.lightText,
  margin: '2px 0',
}

const memberNote = {
  fontSize: '13px',
  color: colors.lightText,
  fontStyle: 'italic' as const,
  marginTop: '4px',
}

const ticketCount = {
  fontSize: '14px',
  color: colors.primary,
  fontWeight: '500',
  textAlign: 'right' as const,
  width: '100px',
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

const contactCard = {
  backgroundColor: colors.background,
  padding: '16px',
  borderRadius: '8px',
}

const contactName = {
  fontSize: '16px',
  fontWeight: '600',
  color: colors.text,
  margin: '0 0 8px',
}

const contactDetail = {
  fontSize: '14px',
  color: colors.lightText,
  margin: '2px 0',
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