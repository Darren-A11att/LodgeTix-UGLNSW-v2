import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { EventPackage } from '@/lib/services/event-tickets-service';

interface PackagePriceDisplayProps {
  package: Pick<EventPackage, 
    'price' | 
    'original_price' | 
    'discount_percentage' | 
    'discount_amount' | 
    'package_type' | 
    'quantity'
  >;
  className?: string;
}

export function PackagePriceDisplay({ package: pkg, className }: PackagePriceDisplayProps) {
  const hasDiscount = pkg.discount_percentage && pkg.discount_percentage > 0;
  
  return (
    <div className={className}>
      {/* Price display */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">
          ${pkg.price.toFixed(2)}
        </span>
        
        {hasDiscount && pkg.original_price && (
          <>
            <span className="text-lg text-gray-500 line-through">
              ${pkg.original_price.toFixed(2)}
            </span>
            <Badge variant="destructive" className="ml-2">
              Save {pkg.discount_percentage}%
            </Badge>
          </>
        )}
      </div>
      
      {/* Package type indicator */}
      {pkg.package_type && (
        <div className="mt-1">
          <Badge variant={pkg.package_type === 'multi_buy' ? 'secondary' : 'default'}>
            {pkg.package_type === 'multi_buy' 
              ? '🎫 Multi-Event Package' 
              : `📦 Bulk Buy (${pkg.quantity} tickets)`
            }
          </Badge>
        </div>
      )}
      
      {/* Savings message */}
      {hasDiscount && pkg.discount_amount && (
        <p className="text-sm text-green-600 mt-1">
          You save ${pkg.discount_amount.toFixed(2)} with this package!
        </p>
      )}
    </div>
  );
}

// Example usage in a ticket selection component
export function PackageCard({ package: pkg }: { package: EventPackage }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold mb-2">{pkg.name}</h3>
      
      {pkg.description && (
        <p className="text-gray-600 text-sm mb-3">{pkg.description}</p>
      )}
      
      <PackagePriceDisplay package={pkg} className="mb-3" />
      
      {/* Package contents */}
      {pkg.includes_description && pkg.includes_description.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm font-medium mb-1">This package includes:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {pkg.includes_description.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-1">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}