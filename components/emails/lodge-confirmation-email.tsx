import React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Hr,
  Button,
  Img,
} from '@react-email/components';

interface LodgeConfirmationEmailProps {
  confirmationNumber: string;
  functionData: {
    name: string;
    startDate: string;
    endDate: string;
    organiser?: {
      name: string;
    };
    location?: {
      place_name: string;
      street_address: string;
      suburb: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  billingDetails: {
    firstName: string;
    lastName: string;
    emailAddress: string;
    mobileNumber?: string;
    addressLine1?: string;
    suburb?: string;
    stateTerritory?: { name: string };
    postcode?: string;
    country?: { name: string };
  };
  lodgeDetails: {
    lodgeName: string;
    grandLodgeName: string;
    lodgeNumber?: string;
  };
  packages: Array<{
    packageName: string;
    packagePrice: number;
    quantity: number;
    totalPrice: number;
  }>;
  subtotal: number;
  stripeFee: number;
  totalAmount: number;
}

export const LodgeConfirmationEmail: React.FC<LodgeConfirmationEmailProps> = ({
  confirmationNumber,
  functionData,
  billingDetails,
  lodgeDetails,
  packages,
  subtotal,
  stripeFee,
  totalAmount,
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const totalPackages = packages.reduce((sum, pkg) => sum + pkg.quantity, 0);

  return (
    <Html>
      <Head />
      <Preview>Lodge registration confirmed for {functionData.name}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Row>
              <Column>
                <Text style={logoText}>LodgeTix</Text>
              </Column>
              <Column style={headerRight}>
                <Text style={backLink}>Back to Event</Text>
              </Column>
            </Row>
          </Section>

          {/* Success Header */}
          <Section style={successSection}>
            <Text style={successIcon}>✅</Text>
            <Heading style={mainHeading}>Lodge Registration Confirmed</Heading>
            <Text style={subtitle}>Thank you for your lodge registration</Text>
          </Section>

          {/* Main Card */}
          <Section style={card}>
            {/* Function Header */}
            <Section style={cardHeader}>
              <Heading style={functionName}>{functionData.name}</Heading>
              <Text style={functionDates}>
                {formatDate(functionData.startDate)} - {formatDate(functionData.endDate)}
              </Text>
            </Section>

            {/* Card Content */}
            <Section style={cardContent}>
              {/* Confirmation Number */}
              <Section style={confirmationBox}>
                <Text style={confirmationLabel}>Confirmation Number</Text>
                <Text style={confirmationNumber}>{confirmationNumber}</Text>
              </Section>

              {/* Contact Details Section */}
              <Section style={detailsGrid}>
                {/* Booking Contact */}
                <Section style={detailSection}>
                  <Heading style={sectionHeading}>👤 Booking Contact</Heading>
                  <Text style={contactName}>
                    {billingDetails.firstName} {billingDetails.lastName}
                  </Text>
                  {billingDetails.emailAddress && (
                    <Text style={contactDetail}>
                      📧 {billingDetails.emailAddress}
                    </Text>
                  )}
                  {billingDetails.mobileNumber && (
                    <Text style={contactDetail}>
                      📞 {billingDetails.mobileNumber}
                    </Text>
                  )}
                  {billingDetails.addressLine1 && (
                    <Section style={addressSection}>
                      <Text style={contactDetail}>{billingDetails.addressLine1}</Text>
                      <Text style={contactDetail}>
                        {billingDetails.suburb}, {billingDetails.stateTerritory?.name} {billingDetails.postcode}
                      </Text>
                      {billingDetails.country?.name && (
                        <Text style={contactDetail}>{billingDetails.country.name}</Text>
                      )}
                    </Section>
                  )}
                </Section>

                {/* Event Details */}
                <Section style={detailSection}>
                  <Heading style={sectionHeading}>🏢 Event Details</Heading>
                  <Text style={eventName}>{functionData.name}</Text>
                  {functionData.organiser?.name && (
                    <Text style={contactDetail}>
                      <strong>Organiser:</strong> {functionData.organiser.name}
                    </Text>
                  )}
                  {functionData.location && (
                    <>
                      <Text style={contactDetail}>
                        📍 {functionData.location.place_name}
                      </Text>
                      <Text style={contactDetail}>{functionData.location.street_address}</Text>
                      <Text style={contactDetail}>
                        {functionData.location.suburb}, {functionData.location.state} {functionData.location.postal_code}
                      </Text>
                      <Text style={contactDetail}>{functionData.location.country}</Text>
                    </>
                  )}
                  <Text style={contactDetail}>
                    📅 {formatDate(functionData.startDate)} - {formatDate(functionData.endDate)}
                  </Text>
                </Section>
              </Section>

              <Hr style={divider} />

              {/* Lodge Registration Details */}
              <Section>
                <Heading style={sectionHeading}>🏛️ Lodge Registration Details</Heading>
                
                <Section style={lodgeCard}>
                  <Section style={lodgeHeader}>
                    <Text style={lodgeName}>
                      {lodgeDetails.lodgeName}
                      {lodgeDetails.lodgeNumber && (
                        <span> (No. {lodgeDetails.lodgeNumber})</span>
                      )}
                    </Text>
                    <Text style={grandLodgeName}>
                      {lodgeDetails.grandLodgeName}
                    </Text>
                  </Section>

                  {/* Important Message */}
                  <Section style={messageBox}>
                    <Text style={messageText}>
                      <strong>Important:</strong> Lodges will need to provide the details of the Attendees who will be assigned the tickets closer to the event.
                    </Text>
                    <Text style={messageText}>
                      Please ensure your attendees have registered directly for the Proclamation Ceremony.
                    </Text>
                  </Section>
                </Section>
              </Section>

              <Hr style={divider} />

              {/* Package Details */}
              <Section>
                <Heading style={sectionHeading}>📦 Package Details</Heading>
                <Section style={packageSection}>
                  {packages.map((pkg, index) => (
                    <Row key={index} style={packageRow}>
                      <Column>
                        <Text style={packageName}>{pkg.packageName}</Text>
                        <Text style={packageQuantity}>Quantity: {pkg.quantity}</Text>
                      </Column>
                      <Column style={{ textAlign: 'right' }}>
                        <Text style={packagePrice}>{formatCurrency(pkg.totalPrice)}</Text>
                        <Text style={packageUnitPrice}>
                          ({formatCurrency(pkg.packagePrice)} each)
                        </Text>
                      </Column>
                    </Row>
                  ))}
                </Section>
              </Section>

              <Hr style={divider} />

              {/* Order Summary */}
              <Section>
                <Heading style={sectionHeading}>💳 Order Summary</Heading>
                <Section style={orderSummary}>
                  <Row style={summaryRow}>
                    <Column>
                      <Text style={summaryLabel}>Subtotal ({totalPackages} packages)</Text>
                    </Column>
                    <Column style={{ textAlign: 'right' }}>
                      <Text style={summaryValue}>{formatCurrency(subtotal)}</Text>
                    </Column>
                  </Row>
                  {stripeFee > 0 && (
                    <Row style={summaryRow}>
                      <Column>
                        <Text style={summaryLabel}>Processing Fee</Text>
                      </Column>
                      <Column style={{ textAlign: 'right' }}>
                        <Text style={summaryValue}>{formatCurrency(stripeFee)}</Text>
                      </Column>
                    </Row>
                  )}
                  <Hr style={summaryDivider} />
                  <Row style={totalRow}>
                    <Column>
                      <Text style={totalLabel}>Total Paid</Text>
                    </Column>
                    <Column style={{ textAlign: 'right' }}>
                      <Text style={totalValue}>{formatCurrency(totalAmount)}</Text>
                    </Column>
                  </Row>
                </Section>
              </Section>

              {/* Footer Message */}
              <Section style={footerMessage}>
                <Text style={footerText}>
                  A confirmation email has been sent to {billingDetails.emailAddress}
                </Text>
                <Text style={footerText}>
                  Please save or print this confirmation for your records
                </Text>
              </Section>
            </Section>
          </Section>

          {/* App Footer */}
          <Section style={appFooter}>
            <Text style={appFooterText}>
              Thank you for using LodgeTix!
            </Text>
            <Text style={appFooterText}>
              LodgeTix is a ticket agent for United Grand Lodge of NSW & ACT
            </Text>
            <Text style={appFooterText}>
              Please contact support@lodgetix.io or phone 0438 871 124
            </Text>
            <Text style={appFooterText}>
              Copyright LodgeTix.io
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles (reusing from individual confirmation email with some additions)
const main = {
  backgroundColor: '#f3f4f6',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px 0',
};

const header = {
  backgroundColor: '#ffffff',
  padding: '14px 24px',
  borderBottom: '1px solid #e5e7eb',
};

const logoText = {
  fontWeight: 'bold',
  fontSize: '18px',
  margin: '0',
};

const headerRight = {
  textAlign: 'right' as const,
};

const backLink = {
  color: '#1e3a8a',
  fontSize: '14px',
  textDecoration: 'underline',
  margin: '0',
};

const successSection = {
  textAlign: 'center' as const,
  padding: '32px 0',
};

const successIcon = {
  fontSize: '48px',
  margin: '0',
};

const mainHeading = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#111827',
  margin: '16px 0 8px',
};

const subtitle = {
  fontSize: '18px',
  color: '#6b7280',
  margin: '0',
};

const card = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  margin: '24px 0',
};

const cardHeader = {
  backgroundColor: '#1e3a8a',
  color: '#ffffff',
  padding: '24px',
};

const functionName = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  color: '#ffffff',
};

const functionDates = {
  fontSize: '16px',
  margin: '8px 0 0',
  color: '#93c5fd',
};

const cardContent = {
  padding: '24px',
};

const confirmationBox = {
  backgroundColor: '#dcfce7',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const confirmationLabel = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#166534',
  margin: '0',
};

const confirmationNumber = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#15803d',
  margin: '8px 0 0',
};

const detailsGrid = {
  marginBottom: '24px',
};

const detailSection = {
  marginBottom: '24px',
};

const sectionHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#111827',
  margin: '0 0 16px',
};

const contactName = {
  fontWeight: '500',
  margin: '0 0 8px',
  fontSize: '16px',
};

const contactDetail = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '4px 0',
};

const eventName = {
  fontWeight: '500',
  margin: '0 0 8px',
  fontSize: '16px',
};

const addressSection = {
  marginTop: '8px',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const lodgeCard = {
  backgroundColor: '#f9fafb',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const lodgeHeader = {
  marginBottom: '16px',
};

const lodgeName = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#111827',
  margin: '0 0 4px',
};

const grandLodgeName = {
  fontSize: '16px',
  color: '#6b7280',
  margin: '0',
};

const messageBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  padding: '12px',
};

const messageText = {
  fontSize: '14px',
  color: '#92400e',
  margin: '4px 0',
};

const packageSection = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '16px',
};

const packageRow = {
  marginBottom: '12px',
  paddingBottom: '12px',
  borderBottom: '1px solid #e5e7eb',
};

const packageName = {
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 4px',
};

const packageQuantity = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};

const packagePrice = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1e3a8a',
  margin: '0',
};

const packageUnitPrice = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '4px 0 0',
};

const orderSummary = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '16px',
};

const summaryRow = {
  marginBottom: '8px',
};

const summaryLabel = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};

const summaryValue = {
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const summaryDivider = {
  borderColor: '#d1d5db',
  margin: '8px 0',
};

const totalRow = {
  marginTop: '8px',
};

const totalLabel = {
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const totalValue = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#1e3a8a',
  margin: '0',
};

const footerMessage = {
  textAlign: 'center' as const,
  padding: '16px 0 0',
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '4px 0',
};

const appFooter = {
  backgroundColor: '#1e3a8a',
  color: '#ffffff',
  padding: '16px',
  textAlign: 'center' as const,
};

const appFooterText = {
  fontSize: '14px',
  margin: '0',
};

export default LodgeConfirmationEmail;