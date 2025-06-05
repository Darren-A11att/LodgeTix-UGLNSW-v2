import React from 'react'
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from '@react-email/components'

export const colors = {
  primary: '#1e40af', // Royal blue
  secondary: '#fbbf24', // Gold
  text: '#1f2937',
  lightText: '#6b7280',
  background: '#f9fafb',
  white: '#ffffff',
  border: '#e5e7eb'
}

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
  functionName?: string
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({
  preview,
  children,
  functionName
}) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Row>
              <Column align="center">
                <Img
                  src="https://lodgetix.com/masonic-logo.png"
                  width="60"
                  height="60"
                  alt="United Grand Lodge of NSW & ACT"
                  style={logo}
                />
              </Column>
            </Row>
            <Text style={headerTitle}>
              United Grand Lodge of NSW & ACT
            </Text>
            {functionName && (
              <Text style={functionTitle}>{functionName}</Text>
            )}
          </Section>

          <Hr style={divider} />

          {/* Main Content */}
          <Section style={content}>
            {children}
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This email was sent by LodgeTix on behalf of the United Grand Lodge of NSW & ACT.
            </Text>
            <Text style={footerText}>
              If you have any questions, please contact us at{' '}
              <Link href="mailto:support@lodgetix.com" style={link}>
                support@lodgetix.com
              </Link>
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} United Grand Lodge of NSW & ACT. All rights reserved.
            </Text>
            <Row style={socialLinks}>
              <Column align="center">
                <Link href="https://uglnsw.org.au" style={socialLink}>
                  Website
                </Link>
                <Text style={separator}>•</Text>
                <Link href="https://lodgetix.com/privacy" style={socialLink}>
                  Privacy Policy
                </Link>
                <Text style={separator}>•</Text>
                <Link href="https://lodgetix.com/terms" style={socialLink}>
                  Terms of Service
                </Link>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: colors.background,
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const header = {
  padding: '24px 0',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto 16px',
}

const headerTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: colors.primary,
  margin: '0',
  textAlign: 'center' as const,
}

const functionTitle = {
  fontSize: '24px',
  fontWeight: '700',
  color: colors.text,
  margin: '8px 0 0',
  textAlign: 'center' as const,
}

const divider = {
  borderColor: colors.border,
  margin: '24px 0',
}

const content = {
  padding: '0 24px',
}

const footer = {
  padding: '24px',
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '14px',
  color: colors.lightText,
  margin: '4px 0',
  textAlign: 'center' as const,
}

const link = {
  color: colors.primary,
  textDecoration: 'underline',
}

const socialLinks = {
  marginTop: '16px',
}

const socialLink = {
  fontSize: '14px',
  color: colors.primary,
  textDecoration: 'none',
  padding: '0 8px',
}

const separator = {
  display: 'inline',
  color: colors.lightText,
  margin: '0 4px',
}