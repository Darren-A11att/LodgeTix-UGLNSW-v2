import Link from 'next/link';
import { getAboutContent, getAboutFeatures, getAboutValues } from '@/lib/services/content-service';
import { Button } from '@/components/ui/button';

export default async function ContentManagementPage() {
  // Fetch all content
  const [content, features, values] = await Promise.all([
    getAboutContent(),
    getAboutFeatures(),
    getAboutValues(),
  ])
    .catch(error => {
      console.error('Error fetching content:', error);
      return [[], [], []];
    });

  const hasNoContent = content.length === 0 && features.length === 0 && values.length === 0;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content Management</h1>
        <div className="space-x-2">
          <Button asChild variant="outline">
            <Link href="/organizer/content/check">Check Content Tables</Link>
          </Button>
          <Button asChild>
            <Link href="/organizer/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
      
      {hasNoContent && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          <p className="mb-2 font-medium">Content tables might be missing</p>
          <p>If you don't see any content below, the content tables might not exist in the database.</p>
          <div className="mt-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/organizer/content/check">Check and Create Tables</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">About Page Content</h2>
        <div className="rounded-lg border">
          <div className="border-b bg-gray-50 p-4">
            <h3 className="font-medium">Sections</h3>
          </div>
          <div className="divide-y">
            {content.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-gray-500">Section: {item.section}</p>
                  </div>
                  <div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/organizer/content/edit/${item.id}`}>Edit</Link>
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-sm">{item.description.substring(0, 150)}...</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Values</h2>
        <div className="rounded-lg border">
          <div className="border-b bg-gray-50 p-4">
            <h3 className="font-medium">Our Values</h3>
          </div>
          <div className="divide-y">
            {values.map((value) => (
              <div key={value.id} className="p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{value.title}</h4>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/organizer/content/values/edit/${value.id}`}>Edit</Link>
                  </Button>
                </div>
                <p className="mt-2 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Features</h2>
        <div className="rounded-lg border">
          <div className="border-b bg-gray-50 p-4">
            <h3 className="font-medium">Feature Highlights</h3>
          </div>
          <div className="divide-y">
            {features.map((feature) => (
              <div key={feature.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{feature.title}</h4>
                    <p className="text-sm text-gray-500">Icon: {feature.icon}</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/organizer/content/features/edit/${feature.id}`}>Edit</Link>
                  </Button>
                </div>
                <p className="mt-2 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}