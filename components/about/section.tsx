import { AboutContent } from '@/lib/services/content-service';

interface AboutSectionProps {
  content: AboutContent;
}

export function AboutSection({ content }: AboutSectionProps) {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">{content.title}</h2>
      {content.subtitle && (
        <p className="mb-2 text-lg text-gray-700">{content.subtitle}</p>
      )}
      <p className="text-gray-600">{content.description}</p>
    </div>
  );
}