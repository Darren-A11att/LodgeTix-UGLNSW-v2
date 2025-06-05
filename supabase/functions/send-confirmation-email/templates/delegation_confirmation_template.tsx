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
import { formatCurrency, formatDate, formatName, formatPhoneNumber, pluralize } from '../utils/formatters.ts'

interface DelegationEmailData extends RegistrationEmailData {
  delegationDetails: {
    name: string
    leader: string
    size: string
  }
  delegates: AttendeeEmailData[]
}

interface Props {
  data: DelegationEmailData
}

export const DelegationConfirmationTemplate: React.FC<Props> = ({ data }) => {
  const preview = `Delegation registration confirmed for ${data.delegationDetails.name} - ${data.functionDetails.name}`
  
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
        <Text style={confirmationTitle}>Delegation Registration Confirmed!</Text>
        <Text style={confirmationText}>
          Thank you for registering your delegation for {data.functionDetails.name}. 
          Your registration has been successfully processed.
        </Text>
      </Section>

      {/* Delegation Details */}
      <Section style={section}>
        <Text style={sectionTitle}>Delegation Information</Text>
        <Row style={detailRow}>
          <Column style={detailLabel}>Delegation Name:</Column>
          <Column style={detailValue}>{data.delegationDetails.name}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>Delegation Leader:</Column>
          <Column style={detailValue}>{data.delegationDetails.leader}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={detailLabel}>Delegation Size:</Column>
          <Column style={detailValue}>{data.delegationDetails.size} delegates</Column>
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

      {/* Delegates Summary */}
      <Section style={section}>
        <Text style={sectionTitle}>Registered Delegates</Text>
        <Text style={summaryText}>
          {data.delegates.length} {pluralize(data.delegates.length, 'delegate', 'delegates')} registered
        </Text>
        
        {/* List first few delegates */}
        {data.delegates.slice(0, 5).map((delegate, index) => (
          <Row key={delegate.id} style={delegateRow}>
            <Column style={delegateNumber}>{index + 1}.</Column>
            <Column style={delegateName}>
              {formatName(delegate.title, delegate.firstName, delegate.lastName)}
              {delegate.role && <Text style={delegateRole}>{delegate.role}</Text>}
            </Column>
          </Row>
        ))}
        
        {data.delegates.length > 5 && (
          <Text style={moreText}>
            ...and {data.delegates.length - 5} more {pluralize(data.delegates.length - 5, 'delegate', 'delegates')}
          </Text>
        )}
      </Section>

      <Hr style={divider} />

      {/* Payment Summary */}
      <Section style={section}>
        <Text style={sectionTitle}>Payment Summary</Text>
        <Row style={detailRow}>
          <Column style={detailLabel}>Registration Total:</Column>
          <Column style={detailValue}>{formatCurrency(data.paymentDetails.subtotal)}</Column>
        </Row>
        {data.paymentDetails.stripeFee > 0 && (
          <>
            <Row style={detailRow}>
              <Column style={detailLabel}>Processing Fee:</Column>
              <Column style={detailValue}>{formatCurrency(data.paymentDetails.stripeFee)}</Column>
            </Row>
            <Hr style={subtotalDivider} />
          </>
        )}
        <Row style={totalRow}>
          <Column style={totalLabel}>Total Paid:</Column>
          <Column style={totalValue}>{formatCurrency(data.paymentDetails.totalAmount)}</Column>
        </Row>
      </Section>

      <Hr style={divider} />

      {/* Booking Contact */}
      {data.bookingContact && (
        <Section style={section}>
          <Text style={sectionTitle}>Delegation Coordinator</Text>
          <Row style={detailRow}>
            <Column style={detailLabel}>Name:</Column>
            <Column style={detailValue}>
              {formatName('', data.bookingContact.firstName, data.bookingContact.lastName)}
            </Column>
          </Row>
          <Row style={detailRow}>
            <Column style={detailLabel}>Email:</Column>
            <Column style={detailValue}>{data.bookingContact.email}</Column>
          </Row>
          {data.bookingContact.phone && (
            <Row style={detailRow}>
              <Column style={detailLabel}>Phone:</Column>
              <Column style={detailValue}>{formatPhoneNumber(data.bookingContact.phone)}</Column>
            </Row>
          )}
        </Section>
      )}

      {/* Actions */}
      <Section style={actionsSection}>
        <Button
          href={`https://lodgetix.com/functions/${data.functionDetails.slug}/register/confirmation/delegation/${data.confirmationNumber}`}
          style={primaryButton}
        >
          View Confirmation Details
        </Button>
      </Section>

      {/* Footer Notes */}
      <Section style={footerSection}>
        <Text style={footerText}>
          Please save this email for your records. Your confirmation number is #{data.confirmationNumber}.
        </Text>
        <Text style={footerText}>
          Individual delegate tickets will be sent separately based on contact preferences.
        </Text>
      </Section>
    </EmailLayout>
  )
}

// Styles
const confirmationHeader = {
  textAlign: 'center' as const,
  padding: '32px 0',
}

const successIcon = {
  margin: '0 auto',
}

const confirmationTitle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: colors.text.primary,
  marginTop: '16px',
  marginBottom: '8px',
}

const confirmationText = {
  fontSize: '16px',
  color: colors.text.secondary,
  lineHeight: '24px',
}

const section = {
  padding: '24px 0',
}

const sectionTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: colors.text.primary,
  marginBottom: '16px',
}

const detailRow = {
  marginBottom: '12px',
}

const detailLabel = {
  fontSize: '14px',
  color: colors.text.secondary,
  width: '140px',
  paddingRight: '16px',
}

const detailValue = {
  fontSize: '14px',
  color: colors.text.primary,
  fontWeight: 500,
}

const summaryText = {
  fontSize: '14px',
  color: colors.text.secondary,
  marginBottom: '16px',
}

const delegateRow = {
  marginBottom: '8px',
  paddingLeft: '16px',
}

const delegateNumber = {
  fontSize: '14px',
  color: colors.text.secondary,
  width: '24px',
}

const delegateName = {
  fontSize: '14px',
  color: colors.text.primary,
}

const delegateRole = {
  fontSize: '12px',
  color: colors.text.secondary,
  fontStyle: 'italic' as const,
}

const moreText = {
  fontSize: '14px',
  color: colors.text.secondary,
  fontStyle: 'italic' as const,
  paddingLeft: '40px',
  marginTop: '8px',
}

const totalRow = {
  marginTop: '8px',
  paddingTop: '8px',
}

const totalLabel = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: colors.text.primary,
  width: '140px',
  paddingRight: '16px',
}

const totalValue = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: colors.brand.primary,
}

const divider = {
  borderColor: colors.border.light,
  margin: '24px 0',
}

const subtotalDivider = {
  borderColor: colors.border.light,
  margin: '8px 0',
}

const actionsSection = {
  textAlign: 'center' as const,
  padding: '32px 0',
}

const primaryButton = {
  backgroundColor: colors.brand.primary,
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  borderRadius: '8px',
  padding: '12px 24px',
  display: 'inline-block',
}

const footerSection = {
  padding: '24px 0',
  borderTop: `1px solid ${colors.border.light}`,
}

const footerText = {
  fontSize: '14px',
  color: colors.text.secondary,
  textAlign: 'center' as const,
  marginBottom: '8px',
}