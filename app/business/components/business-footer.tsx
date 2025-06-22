import Link from 'next/link';
import { MasonicLogo } from '@/components/masonic-logo';
import { COMPANY_INFO, BRAND_POSITIONING, CompanyFormatters } from '@/lib/constants/company-details';

export function BusinessFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MasonicLogo size="sm" />
              <span className="text-lg font-semibold text-white">LodgeTix</span>
            </div>
            <p className="text-sm">
              {BRAND_POSITIONING.primary}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/business" className="hover:text-white">Overview</Link></li>
              <li><Link href="/business/product" className="hover:text-white">Features</Link></li>
              <li><Link href="/business/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/business/solutions" className="hover:text-white">Solutions</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/business/help" className="hover:text-white">Help Center</Link></li>
              <li><Link href="/business/about/contact" className="hover:text-white">Contact Us</Link></li>
              <li><Link href="/business/support" className="hover:text-white">Support</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/business/about/terms/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/business/about/terms/service-terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="/business/about/terms/payment-terms" className="hover:text-white">Payment Terms</Link></li>
              <li><Link href="/business/about/terms/limited-agent" className="hover:text-white">Limited Agent Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {COMPANY_INFO.tradingName}. All rights reserved.</p>
          <p className="mt-2 text-xs text-gray-400">{CompanyFormatters.getLegalEntity()}</p>
        </div>
      </div>
    </footer>
  );
}