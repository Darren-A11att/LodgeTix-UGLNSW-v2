import { BusinessHeader } from './components/business-header';
import { BusinessFooter } from './components/business-footer';

export default function BusinessLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <BusinessHeader />
      <main className="flex-1">
        {children}
      </main>
      <BusinessFooter />
    </div>
  );
}