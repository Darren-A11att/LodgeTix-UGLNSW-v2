import { AboutFeature } from '@/lib/services/content-service';
import { ShieldCheck, LayoutGrid, Users, Shield } from 'lucide-react';

interface AboutFeaturesProps {
  features: AboutFeature[];
}

// Map of icon names to Lucide React components
const iconMap: Record<string, React.ElementType> = {
  'shield': Shield,
  'shield-check': ShieldCheck,
  'layout-grid': LayoutGrid,
  'users': Users,
};

export function AboutFeatures({ features }: AboutFeaturesProps) {
  return (
    <div className="mb-12">
      <h2 className="mb-6 text-2xl font-bold">Features Built for Masonic Events</h2>
      <div className="space-y-4">
        {features.map((feature) => {
          const IconComponent = iconMap[feature.icon] || Shield;
          
          return (
            <div key={feature.id} className="flex items-start">
              <div className="mr-4 rounded-full bg-blue-100 p-2">
                <IconComponent className="text-blue-700" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}