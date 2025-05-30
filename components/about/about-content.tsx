import { AboutSection } from './section';
import { AboutValues } from './values';
import { AboutFeatures } from './features';
import { getAboutContent, getAboutFeatures, getAboutValues } from '@/lib/services/content-service';

// Default content if database tables don't exist yet
const defaultContent = [
  {
    id: 'default-mission',
    section: 'mission',
    title: 'Our Mission',
    description: 'LodgeTix was founded with a simple mission: to make Masonic event management easier and more accessible for Lodges of all sizes. We understand the unique needs of Masonic organisations and have built our platform specifically to address those needs.',
    order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-history',
    section: 'history',
    title: 'Created By Freemasons',
    description: 'As active Freemasons ourselves, we\'ve experienced firsthand the challenges of organizing Lodge meetings, degree ceremonies, installations, and social events. We\'ve built LodgeTix to solve the problems we encountered, creating a platform that respects Masonic traditions while embracing modern technology.',
    order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const defaultValues = [
  {
    id: 'default-value-1',
    title: 'Brotherly Love',
    description: 'We believe in fostering connections between Brethren across different Lodges and jurisdictions.',
    order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-value-2',
    title: 'Relief',
    description: 'We aim to relieve the administrative burden on Lodge Secretaries and event organisers.',
    order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-value-3',
    title: 'Truth',
    description: 'We operate with transparency and integrity in all our business practices.',
    order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const defaultFeatures = [
  {
    id: 'default-feature-1',
    title: 'Masonic-Specific Event Types',
    description: 'Create events specifically for Lodge meetings, degree ceremonies, installations, and festive boards with fields tailored to Masonic needs.',
    icon: 'shield',
    order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-feature-2',
    title: 'Privacy Controls',
    description: 'Control who can see your events with options for public events, members-only events, and private events.',
    icon: 'layout-grid',
    order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-feature-3',
    title: 'Visitor Management',
    description: 'Easily manage visiting Brethren with special ticket types and the ability to collect Lodge information.',
    icon: 'users',
    order: 3,
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

      {/* History Section */}
      {contentBySections.history && (
        <AboutSection content={contentBySections.history} />
      )}

      {/* Values Section */}
      <AboutValues values={values} />

      {/* Features Section */}
      <AboutFeatures features={features} />
    </div>
  );
}