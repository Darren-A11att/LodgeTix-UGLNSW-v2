import { AboutSection } from './section';
import { AboutValues } from './values';
import { AboutFeatures } from './features';
import { getAboutContent, getAboutFeatures, getAboutValues } from '@/lib/services/content-service';

// Default content if database tables don't exist yet
const defaultContent = [
  {
    id: 'default-mission',
    section: 'mission',
    title: 'Our Mission: Connecting the Masonic Community',
    description: 'LodgeTix exists to serve the global Masonic community by providing a comprehensive event management platform that honours our fraternal heritage while embracing modern efficiency. We are dedicated to strengthening the bonds between Brethren by making Masonic events more accessible, secure, and meaningful for all participants. Our mission is built on the fundamental Masonic principles of Brotherly Love, Relief, and Truth – providing relief to Lodge administrators, fostering brotherly connections across jurisdictions, and operating with complete transparency and integrity.',
    order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-story',
    section: 'story',
    title: 'Founded by Freemasons, for Freemasons',
    description: 'LodgeTix was born from the real-world experiences of active Freemasons who understood the unique challenges facing modern Lodges. Developed by Winding Stair Pty. Limited, our founding team comprises experienced Brethren who have served in various Lodge offices – from Lodge Secretary managing countless registrations by hand, to Worshipful Masters coordinating major installation ceremonies, to event organisers struggling with outdated ticketing platforms that simply didn\'t understand Masonic requirements. We witnessed firsthand how traditional event management systems failed to capture essential Masonic information like Grand Lodge affiliations, proper titles, or ceremonial requirements. After years of wrestling with generic platforms that treated our sacred ceremonies like corporate conferences, we decided to build something better. Our vision was simple: create a platform that truly understands Masonic culture, respects our traditions, and serves the genuine needs of our fraternal community.',
    order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-value-proposition',
    section: 'value-proposition',
    title: 'What Makes LodgeTix Different',
    description: 'Unlike generic ticketing platforms, LodgeTix is purpose-built for the Masonic community with deep understanding of our unique requirements. We capture comprehensive Masonic profiles including titles, ranks, Lodge affiliations, and Grand Lodge jurisdictions – information essential for proper protocol and ceremony planning. Our platform manages complex multi-event functions like installation weekends, handles Lodge delegation registrations, and maintains the privacy and security standards our fraternal community requires. Where other platforms see customers, we see Brethren. Where they offer generic event management, we provide Masonic-specific solutions. Our eligibility verification ensures only qualified members attend restricted events, our automated communications maintain proper Masonic etiquette, and our financial systems provide direct payments to Lodge accounts with complete transparency.',
    order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-security',
    section: 'security',
    title: 'Privacy and Security: Our Sacred Obligation',
    description: 'Privacy and confidentiality are fundamental to Masonic tradition, and we\'ve built LodgeTix with these principles at its core. Our platform employs enterprise-grade security measures including end-to-end encryption, role-based access controls, and Australian Privacy Act compliance to protect member information. We collect only the minimum data necessary for event management, never share information with commercial partners, and maintain strict purpose limitation on data usage. Your Masonic credentials, Lodge affiliations, and event attendance remain confidential within our secure system. We understand that maintaining fraternal privacy isn\'t just good business practice – it\'s our obligation to the Brethren who trust us with their information. Our commitment to security extends beyond technology to our business practices, staff training, and ongoing compliance monitoring.',
    order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-community',
    section: 'community',
    title: 'Strengthening Masonic Bonds Across Jurisdictions',
    description: 'LodgeTix serves as a bridge connecting Brethren across different Lodges, Districts, and Grand Lodge jurisdictions throughout Australia and beyond. Our platform facilitates meaningful connections by enabling Brethren to discover events outside their home Lodge, participate in inter-jurisdictional ceremonies, and build relationships with fellow Masons from diverse backgrounds. We support the principle of Masonic universality by accommodating different jurisdictional requirements while maintaining recognition standards. Whether you\'re a newly raised Brother seeking to expand your Masonic education or a Past Master looking to support neighbouring Lodges, LodgeTix helps you find and participate in the events that will enrich your Masonic journey. Our community features respect the autonomous nature of each Lodge while creating opportunities for broader fraternal fellowship.',
    order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-vision',
    section: 'vision',
    title: 'Our Vision for the Future',
    description: 'We envision a future where technology serves to strengthen rather than replace traditional Masonic practices. Our roadmap includes expanding LodgeTix globally to serve Masonic communities worldwide, while maintaining the personalised service and fraternal understanding that sets us apart. We\'re developing advanced features like integrated Lodge communications, ceremony planning tools, and educational resource sharing – all designed to support Lodge operations without compromising traditional values. We aim to become the trusted technology partner for Grand Lodges, helping them better serve their constituent Lodges while maintaining their sovereign authority. Our ultimate goal is to ensure that every Brother, regardless of location or technological expertise, can easily participate in the rich ceremonial and social life of Freemasonry.',
    order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const defaultValues = [
  {
    id: 'default-value-1',
    title: 'Fraternal Heritage',
    description: 'Built by Freemasons for Freemasons, we understand the significance of proper protocol and designed our platform with Masonic traditions at heart, respecting the dignity of our fraternal heritage.',
    order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-value-2',
    title: 'Modern Efficiency',
    description: 'We deliver traditional values with modern convenience, providing streamlined registration without compromising tradition and efficient solutions for contemporary Lodge administration.',
    order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-value-3',
    title: 'Security & Privacy',
    description: 'Your privacy is our sacred obligation. We\'ve built LodgeTix with Masonic confidentiality principles, using privacy-first design to protect fraternal information with complete discretion.',
    order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-value-4',
    title: 'Community Connection',
    description: 'We focus on strengthening bonds between Brethren by connecting Lodges across jurisdictions, building stronger Masonic communities, and facilitating meaningful fraternal fellowship.',
    order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-value-5',
    title: 'Professional Excellence',
    description: 'We demonstrate excellence in all we do, providing professional-grade event management on a reliable platform you can trust – excellence worthy of our fraternal standards.',
    order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const defaultFeatures = [
  {
    id: 'default-feature-1',
    title: 'Comprehensive Masonic Profiles',
    description: 'Capture complete Masonic credentials including titles, ranks, Lodge affiliations, and Grand Lodge jurisdictions. One-time setup provides lifetime convenience for all future registrations.',
    icon: 'shield',
    order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-feature-2',
    title: 'Multi-Event Function Management',
    description: 'Manage complex installation weekends, multi-day conferences, and celebration series with centralised attendee management and coordinated logistics across multiple related events.',
    icon: 'layout-grid',
    order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-feature-3',
    title: 'Lodge Delegation Registration',
    description: 'Streamline Lodge group registrations with specialised workflows for multiple members, automatic Lodge validation, and consolidated billing direct to Lodge accounts.',
    icon: 'users',
    order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-feature-4',
    title: 'Eligibility & Protocol Management',
    description: 'Automated eligibility verification based on Masonic membership, degree requirements, and jurisdictional recognition. Ensures proper protocol compliance for all ceremonial events.',
    icon: 'key',
    order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-feature-5',
    title: 'Secure Payment Processing',
    description: 'Direct payments to Lodge accounts via Stripe Connect with real-time financial reporting, automated reconciliation, and transparent fee structures. PCI-compliant and auditable.',
    icon: 'credit-card',
    order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-feature-6',
    title: 'Automated Communications',
    description: 'Professional confirmation emails, QR code tickets, and event reminders with Masonic-appropriate tone and terminology. Maintains dignified communications throughout the event lifecycle.',
    icon: 'mail',
    order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export async function AboutContent() {
  // Fetch all content in parallel
  const [dbContent, dbFeatures, dbValues] = await Promise.all([
    getAboutContent(),
    getAboutFeatures(),
    getAboutValues(),
  ]).catch(() => {
    console.warn('Error fetching about content, using default values');
    return [[], [], []];
  });

  // Use database content if available, otherwise fall back to defaults
  const content = dbContent.length > 0 ? dbContent : defaultContent;
  const features = dbFeatures.length > 0 ? dbFeatures : defaultFeatures;
  const values = dbValues.length > 0 ? dbValues : defaultValues;

  // Group content by section for easier rendering
  const contentBySections = content.reduce((acc, item) => {
    acc[item.section] = item;
    return acc;
  }, {} as Record<string, typeof content[0]>);

  return (
    <div className="mb-12 space-y-8">
      {/* Mission Section */}
      {contentBySections.mission && (
        <AboutSection content={contentBySections.mission} />
      )}

      {/* Company Story Section */}
      {contentBySections.story && (
        <AboutSection content={contentBySections.story} />
      )}

      {/* Value Proposition Section */}
      {contentBySections['value-proposition'] && (
        <AboutSection content={contentBySections['value-proposition']} />
      )}

      {/* Platform Features Section */}
      <AboutFeatures features={features} />

      {/* Community Commitment Section (Values) */}
      <AboutValues values={values} />

      {/* Security & Privacy Section */}
      {contentBySections.security && (
        <AboutSection content={contentBySections.security} />
      )}

      {/* Future Vision Section */}
      {contentBySections.vision && (
        <AboutSection content={contentBySections.vision} />
      )}
    </div>
  );
}