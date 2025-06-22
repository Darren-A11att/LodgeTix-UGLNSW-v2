"use client"

import { useState } from 'react'
import { CheckIcon, MinusIcon } from '@heroicons/react/20/solid'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { CreditCard, Shield, Users } from 'lucide-react'

interface PricingTier {
  name: string
  id: string
  href: string
  price: string
  priceUnit?: string
  attendeeRange: string
  description: string
  features: string[]
  mostPopular?: boolean
}

const subscriptionTiers: PricingTier[] = [
  {
    name: 'Basic',
    id: 'tier-basic',
    href: '/business/about/contact',
    price: '$19',
    priceUnit: 'month',
    attendeeRange: 'Up to 30 Attendees',
    description: 'Essential tools for small lodges hosting monthly meetings and events',
    features: [
      'Perfect for monthly lodge meetings',
      'Up to 30 attendees per event',
      'Basic registration management',
      'QR code check-in',
      'Payment communication tools',
      'Email confirmations',
      'Standard support'
    ],
    mostPopular: false
  },
  {
    name: 'Standard',
    id: 'tier-standard',
    href: '/business/about/contact',
    price: '$49',
    priceUnit: 'month',
    attendeeRange: 'Up to 100 Attendees',
    description: 'Perfect for active lodges with monthly meetings and regular social events',
    features: [
      'Ideal for monthly meetings & events',
      'Up to 100 attendees per event',
      'All Basic features',
      'Advanced seating management',
      'Multiple ticket types',
      'Dietary requirements tracking',
      'Custom branding options',
      'Priority email support',
      'Export to CSV/Excel'
    ],
    mostPopular: true
  },
  {
    name: 'Grand Lodges',
    id: 'tier-grand-lodge',
    href: '/business/about/contact',
    price: 'Custom',
    priceUnit: '',
    attendeeRange: 'Unlimited',
    description: 'Enterprise solution for Grand Lodges hosting quarterly and annual Communications & Installations',
    features: [
      'Built for quarterly & annual events',
      'Unlimited attendees',
      'All Standard features',
      'Multi-lodge management',
      'Advanced analytics & reporting',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'Phone & priority support',
      'Custom training sessions',
      'SLA guarantees'
    ],
    mostPopular: false
  }
]

const addonPacks = [
  {
    name: 'Special Events Pack',
    price: '$10',
    priceUnit: 'per event',
    description: 'Complete event management for your special occasions',
    features: [
      'Unlimited Attendees',
      'QR Scanner Check In App',
      'Seating Management',
      'Automated Attendee Emails',
      'Onsite Registration & Ticket Purchase',
      'Vendor & Supplier Management',
      'Advanced Expense & Finance Tracking'
    ],
    featured: false
  },
  {
    name: 'Event Kiosk',
    price: '$5',
    priceUnit: 'per event',
    description: 'Transform your event with onsite sales capabilities',
    features: [
      'Onsite Registration & Ticket Purchase',
      'Merchandise Sales at Event',
      'Food & Beverage Sales',
      'Onsite Payments via Terminal Device',
      'Online Web Payments via QR Code',
      'Lead Capture & CRM Integration'
    ],
    featured: false
  },
  {
    name: 'Printed Materials & Collateral',
    price: 'Request a Quote',
    priceUnit: '',
    description: 'Professional printing services for all your event needs',
    features: [
      'Event Programs',
      'Banquet Menus',
      'Signage & Banners',
      'Gift Bags & Keepsakes',
      'Templates & Design'
    ],
    featured: false
  },
  {
    name: 'Masonic Orders',
    price: 'Coming Soon',
    priceUnit: '',
    description: 'Specialized features for appendant Masonic bodies',
    features: [
      'Mark & Royal Arch',
      'Ancient & Accepted Scottish Rite',
      'Order of the Secret Monitor',
      'Knights Templar',
      'Royal Order of Scotland'
    ],
    featured: true
  }
]

const paymentOptions = [
  {
    title: 'Share Payment Instructions',
    description: 'Display your lodge bank details for direct transfers',
    features: [
      'Show bank account details to attendees',
      'Reconciliation dashboard for tracking',
      'No payment processing fees',
      'Complete control over lodge funds'
    ]
  },
  {
    title: 'Integrate Payment Provider',
    description: 'Connect your existing Stripe or Square account',
    features: [
      'Use your own merchant account',
      'Direct settlements to your bank',
      'Your negotiated transaction rates',
      'Full ownership of payment data'
    ]
  },
  {
    title: 'Take Payments as Your Agent',
    description: 'Let LodgeTix handle payments on your behalf',
    features: [
      'Simplified payment collection',
      'Risk-managed fund releases',
      'Comprehensive reconciliation',
      'Dedicated payment support'
    ]
  }
]

const comparisonFeatures = [
  { name: 'Attendees per event', basic: 'Up to 30', standard: 'Up to 100', grandLodge: 'Unlimited' },
  { name: 'Registration management', basic: true, standard: true, grandLodge: true },
  { name: 'QR code check-in', basic: true, standard: true, grandLodge: true },
  { name: 'Email confirmations', basic: true, standard: true, grandLodge: true },
  { name: 'Custom branding', basic: false, standard: true, grandLodge: true },
  { name: 'Seating management', basic: false, standard: true, grandLodge: true },
  { name: 'Multiple ticket types', basic: false, standard: true, grandLodge: true },
  { name: 'Dietary requirements', basic: false, standard: true, grandLodge: true },
  { name: 'Export data', basic: false, standard: true, grandLodge: true },
  { name: 'Multi-lodge management', basic: false, standard: false, grandLodge: true },
  { name: 'API access', basic: false, standard: false, grandLodge: true },
  { name: 'Phone support', basic: false, standard: false, grandLodge: true },
  { name: 'Dedicated account manager', basic: false, standard: false, grandLodge: true },
  { name: 'Custom training', basic: false, standard: false, grandLodge: true },
]

const faqs = [
  {
    question: 'How does LodgeTix help with payment processing?',
    answer: 'We provide three flexible options: display your bank details for direct transfers, integrate with your existing payment provider (Stripe/Square), or use our optional agent services. You maintain control over how attendees pay for your events.'
  },
  {
    question: 'Can I upgrade my plan later?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any differences.'
  },
  {
    question: 'What are Add-on Packs?',
    answer: 'Add-on packs are per-event enhancements. Special Events ($10) removes attendee limits for one event, while Event Kiosk ($5) enables on-site check-in capabilities.'
  },
  {
    question: 'Do you offer discounts for Grand Lodges?',
    answer: 'Yes, we offer custom pricing for Grand Lodges managing multiple subordinate lodges. Contact us for a tailored solution.'
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No setup fees! Start using LodgeTix immediately after signing up.'
  },
  {
    question: 'How does the free trial work?',
    answer: 'Try LodgeTix free for 30 days with full access to all Standard features. No credit card required to start.'
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Three Tiers */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-base font-semibold leading-7 text-masonic-gold">Pricing</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Choose the right plan for your lodge
            </p>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
            Simple monthly pricing for our event management software. Payment processing is handled by you or your chosen provider.
          </p>
          
          <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {subscriptionTiers.map((tier, tierIdx) => (
              <div
                key={tier.id}
                className={cn(
                  tierIdx === 1 ? 'lg:z-10 lg:rounded-b-none' : 'lg:mt-8',
                  tier.mostPopular ? 'ring-2 ring-masonic-gold' : 'ring-1 ring-gray-200',
                  'flex flex-col justify-between rounded-3xl bg-white p-8 xl:p-10'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-x-4">
                    <h3
                      id={tier.id}
                      className={cn(
                        tier.mostPopular ? 'text-masonic-gold' : 'text-gray-900',
                        'text-lg font-semibold leading-8'
                      )}
                    >
                      {tier.name}
                    </h3>
                    {tier.mostPopular ? (
                      <p className="rounded-full bg-masonic-gold/10 px-2.5 py-1 text-xs font-semibold leading-5 text-masonic-gold">
                        Most popular
                      </p>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-600">{tier.description}</p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">{tier.price}</span>
                    {tier.priceUnit && <span className="text-sm font-semibold leading-6 text-gray-600">/{tier.priceUnit}</span>}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{tier.attendeeRange}</p>
                  <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckIcon className="h-6 w-5 flex-none text-masonic-gold" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  asChild
                  className={cn(
                    'mt-8 w-full',
                    tier.mostPopular
                      ? 'bg-masonic-gold hover:bg-masonic-lightgold text-masonic-navy'
                      : 'bg-masonic-navy hover:bg-masonic-blue text-white'
                  )}
                  size="lg"
                >
                  <a href={tier.href}>
                    {tier.name === 'Grand Lodges' ? 'Contact Sales' : 'Start Free Trial'}
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add-on Packs Section - Four Tiers */}
      <div className="bg-gray-50 py-16">
        <div className="mx-auto px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Boost Packs</h2>
            <p className="mt-4 text-lg text-gray-600">
              Enhance your events with powerful add-ons and specialized features
            </p>
          </div>
          
          <div className="mx-auto mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {addonPacks.map((pack) => (
              <div
                key={pack.name}
                className={cn(
                  "flex flex-col justify-between rounded-3xl p-8 ring-1",
                  pack.featured 
                    ? "ring-2 ring-masonic-gold bg-masonic-lightblue" 
                    : "ring-gray-200 bg-white"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-x-4">
                    <h3 className={cn(
                      "text-lg/8 font-semibold",
                      pack.featured ? "text-masonic-navy" : "text-gray-900"
                    )}>
                      {pack.name}
                    </h3>
                    {pack.featured && (
                      <p className="rounded-full bg-masonic-gold/10 px-2.5 py-1 text-xs/5 font-semibold text-masonic-gold">
                        Coming Soon
                      </p>
                    )}
                  </div>
                  <p className="mt-4 text-sm/6 text-gray-600">{pack.description}</p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className={cn(
                      "text-4xl font-semibold tracking-tight",
                      pack.featured ? "text-masonic-navy" : "text-gray-900"
                    )}>
                      {pack.price}
                    </span>
                    {pack.priceUnit && (
                      <span className="text-sm/6 font-semibold text-gray-600">/{pack.priceUnit}</span>
                    )}
                  </p>
                  <ul role="list" className="mt-8 space-y-3 text-sm/6 text-gray-600">
                    {pack.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckIcon 
                          aria-hidden="true" 
                          className={cn(
                            "h-6 w-5 flex-none",
                            pack.featured ? "text-masonic-navy" : "text-masonic-gold"
                          )} 
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  asChild 
                  variant={pack.featured ? "default" : "outline"}
                  className={cn(
                    "mt-8 w-full",
                    pack.featured && "bg-masonic-navy hover:bg-masonic-blue text-white"
                  )}
                  size="lg"
                >
                  <a href="/business/about/contact">
                    {pack.price === 'Request a Quote' ? 'Get Quote' : 
                     pack.price === 'Coming Soon' ? 'Learn More' : 'Add to My Account'}
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Table - Dark Style */}
      <div className="bg-gray-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Compare Plans</h2>
            <p className="mt-4 text-lg text-gray-400">
              See which plan is right for your lodge
            </p>
          </div>

          {/* Mobile comparison */}
          <div className="mx-auto mt-12 max-w-md space-y-8 sm:mt-16 lg:hidden">
            {subscriptionTiers.map((tier) => (
              <section
                key={tier.id}
                className={cn(
                  tier.mostPopular ? 'rounded-xl bg-white/5 ring-1 ring-white/10 ring-inset' : '',
                  'p-8'
                )}
              >
                <h3 id={tier.id} className="text-sm/6 font-semibold text-white">
                  {tier.name}
                </h3>
                <p className="mt-2 flex items-baseline gap-x-1">
                  <span className="text-4xl font-semibold text-white">{tier.price}</span>
                  {tier.priceUnit && <span className="text-sm font-semibold text-gray-300">/{tier.priceUnit}</span>}
                </p>
                <p className="mt-1 text-sm text-gray-400">{tier.attendeeRange}</p>
                <ul role="list" className="mt-10 space-y-4 text-sm/6 text-white">
                  {comparisonFeatures.map((feature) => {
                    const value = feature[tier.name === 'Basic' ? 'basic' : tier.name === 'Standard' ? 'standard' : 'grandLodge'];
                    return typeof value === 'boolean' && value ? (
                      <li key={feature.name} className="flex gap-x-3">
                        <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-masonic-gold" />
                        <span>{feature.name}</span>
                      </li>
                    ) : typeof value === 'string' ? (
                      <li key={feature.name} className="flex gap-x-3">
                        <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-masonic-gold" />
                        <span>
                          {feature.name} <span className="text-sm/6 text-gray-400">({value})</span>
                        </span>
                      </li>
                    ) : null;
                  })}
                </ul>
              </section>
            ))}
          </div>

          {/* Desktop comparison table */}
          <div className="isolate mt-20 hidden lg:block">
            <div className="relative -mx-8">
              <div className="absolute inset-x-4 inset-y-0 -z-10 flex">
                <div
                  style={{ marginLeft: '50%' }}
                  aria-hidden="true"
                  className="flex w-1/3 px-4"
                >
                  <div className="w-full rounded-t-xl border-x border-t border-white/10 bg-white/5" />
                </div>
              </div>
              <table className="w-full table-fixed border-separate border-spacing-x-8 text-left">
                <caption className="sr-only">Pricing plan comparison</caption>
                <colgroup>
                  <col className="w-1/4" />
                  <col className="w-1/4" />
                  <col className="w-1/4" />
                  <col className="w-1/4" />
                </colgroup>
                <thead>
                  <tr>
                    <td />
                    {subscriptionTiers.map((tier) => (
                      <th key={tier.id} scope="col" className="px-6 pt-6 xl:px-8 xl:pt-8">
                        <div className="text-sm/7 font-semibold text-white">{tier.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">
                      <span className="sr-only">Price</span>
                    </th>
                    {subscriptionTiers.map((tier) => (
                      <td key={tier.id} className="px-6 pt-2 xl:px-8">
                        <div className="flex flex-col gap-x-1 text-white">
                          <div className="flex items-baseline gap-x-1">
                            <span className="text-4xl font-semibold">{tier.price}</span>
                            {tier.priceUnit && <span className="text-sm/6 font-semibold">/{tier.priceUnit}</span>}
                          </div>
                          <span className="text-sm text-gray-400">{tier.attendeeRange}</span>
                        </div>
                        <Button
                          asChild
                          className={cn(
                            'mt-8 w-full',
                            tier.mostPopular
                              ? 'bg-masonic-gold hover:bg-masonic-lightgold text-masonic-navy'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          )}
                        >
                          <a href={tier.href}>
                            {tier.name === 'Grand Lodges' ? 'Contact Sales' : 'Start Free Trial'}
                          </a>
                        </Button>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={4}
                      className="pt-8 pb-4 text-sm/6 font-semibold text-white"
                    >
                      Core Features
                      <div className="absolute inset-x-8 mt-4 h-px bg-white/10" />
                    </th>
                  </tr>
                  {comparisonFeatures.slice(0, 4).map((feature) => (
                    <tr key={feature.name}>
                      <th scope="row" className="py-4 text-sm/6 font-normal text-white">
                        {feature.name}
                        <div className="absolute inset-x-8 mt-4 h-px bg-white/5" />
                      </th>
                      <td className="px-6 py-4 xl:px-8">
                        {typeof feature.basic === 'string' ? (
                          <div className="text-center text-sm/6 text-gray-300">{feature.basic}</div>
                        ) : (
                          <>
                            {feature.basic === true ? (
                              <CheckIcon aria-hidden="true" className="mx-auto size-5 text-masonic-gold" />
                            ) : (
                              <MinusIcon aria-hidden="true" className="mx-auto size-5 text-gray-500" />
                            )}
                            <span className="sr-only">
                              {feature.basic === true ? 'Included' : 'Not included'} in Basic
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 xl:px-8">
                        {typeof feature.standard === 'string' ? (
                          <div className="text-center text-sm/6 text-gray-300">{feature.standard}</div>
                        ) : (
                          <>
                            {feature.standard === true ? (
                              <CheckIcon aria-hidden="true" className="mx-auto size-5 text-masonic-gold" />
                            ) : (
                              <MinusIcon aria-hidden="true" className="mx-auto size-5 text-gray-500" />
                            )}
                            <span className="sr-only">
                              {feature.standard === true ? 'Included' : 'Not included'} in Standard
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 xl:px-8">
                        {typeof feature.grandLodge === 'string' ? (
                          <div className="text-center text-sm/6 text-gray-300">{feature.grandLodge}</div>
                        ) : (
                          <>
                            {feature.grandLodge === true ? (
                              <CheckIcon aria-hidden="true" className="mx-auto size-5 text-masonic-gold" />
                            ) : (
                              <MinusIcon aria-hidden="true" className="mx-auto size-5 text-gray-500" />
                            )}
                            <span className="sr-only">
                              {feature.grandLodge === true ? 'Included' : 'Not included'} in Grand Lodges
                            </span>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={4}
                      className="pt-16 pb-4 text-sm/6 font-semibold text-white"
                    >
                      Advanced Features
                      <div className="absolute inset-x-8 mt-4 h-px bg-white/10" />
                    </th>
                  </tr>
                  {comparisonFeatures.slice(4, 9).map((feature) => (
                    <tr key={feature.name}>
                      <th scope="row" className="py-4 text-sm/6 font-normal text-white">
                        {feature.name}
                        <div className="absolute inset-x-8 mt-4 h-px bg-white/5" />
                      </th>
                      <td className="px-6 py-4 xl:px-8">
                        {typeof feature.basic === 'string' ? (
                          <div className="text-center text-sm/6 text-gray-300">{feature.basic}</div>
                        ) : (
                          <>
                            {feature.basic === true ? (
                              <CheckIcon aria-hidden="true" className="mx-auto size-5 text-masonic-gold" />
                            ) : (
                              <MinusIcon aria-hidden="true" className="mx-auto size-5 text-gray-500" />
                            )}
                            <span className="sr-only">
                              {feature.basic === true ? 'Included' : 'Not included'} in Basic
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 xl:px-8">
                        {typeof feature.standard === 'string' ? (
                          <div className="text-center text-sm/6 text-gray-300">{feature.standard}</div>
                        ) : (
                          <>
                            {feature.standard === true ? (
                              <CheckIcon aria-hidden="true" className="mx-auto size-5 text-masonic-gold" />
                            ) : (
                              <MinusIcon aria-hidden="true" className="mx-auto size-5 text-gray-500" />
                            )}
                            <span className="sr-only">
                              {feature.standard === true ? 'Included' : 'Not included'} in Standard
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 xl:px-8">
                        {typeof feature.grandLodge === 'string' ? (
                          <div className="text-center text-sm/6 text-gray-300">{feature.grandLodge}</div>
                        ) : (
                          <>
                            {feature.grandLodge === true ? (
                              <CheckIcon aria-hidden="true" className="mx-auto size-5 text-masonic-gold" />
                            ) : (
                              <MinusIcon aria-hidden="true" className="mx-auto size-5 text-gray-500" />
                            )}
                            <span className="sr-only">
                              {feature.grandLodge === true ? 'Included' : 'Not included'} in Grand Lodges
                            </span>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={4}
                      className="pt-16 pb-4 text-sm/6 font-semibold text-white"
                    >
                      Enterprise Features
                      <div className="absolute inset-x-8 mt-4 h-px bg-white/10" />
                    </th>
                  </tr>
                  {comparisonFeatures.slice(9).map((feature) => (
                    <tr key={feature.name}>
                      <th scope="row" className="py-4 text-sm/6 font-normal text-white">
                        {feature.name}
                        <div className="absolute inset-x-8 mt-4 h-px bg-white/5" />
                      </th>
                      <td className="px-6 py-4 xl:px-8">
                        {typeof feature.basic === 'string' ? (
                          <div className="text-center text-sm/6 text-gray-300">{feature.basic}</div>
                        ) : (
                          <>
                            {feature.basic === true ? (
                              <CheckIcon aria-hidden="true" className="mx-auto size-5 text-masonic-gold" />
                            ) : (
                              <MinusIcon aria-hidden="true" className="mx-auto size-5 text-gray-500" />
                            )}
                            <span className="sr-only">
                              {feature.basic === true ? 'Included' : 'Not included'} in Basic
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 xl:px-8">
                        {typeof feature.standard === 'string' ? (
                          <div className="text-center text-sm/6 text-gray-300">{feature.standard}</div>
                        ) : (
                          <>
                            {feature.standard === true ? (
                              <CheckIcon aria-hidden="true" className="mx-auto size-5 text-masonic-gold" />
                            ) : (
                              <MinusIcon aria-hidden="true" className="mx-auto size-5 text-gray-500" />
                            )}
                            <span className="sr-only">
                              {feature.standard === true ? 'Included' : 'Not included'} in Standard
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 xl:px-8">
                        {typeof feature.grandLodge === 'string' ? (
                          <div className="text-center text-sm/6 text-gray-300">{feature.grandLodge}</div>
                        ) : (
                          <>
                            {feature.grandLodge === true ? (
                              <CheckIcon aria-hidden="true" className="mx-auto size-5 text-masonic-gold" />
                            ) : (
                              <MinusIcon aria-hidden="true" className="mx-auto size-5 text-gray-500" />
                            )}
                            <span className="sr-only">
                              {feature.grandLodge === true ? 'Included' : 'Not included'} in Grand Lodges
                            </span>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Processing Solutions - Three Columns */}
      <div className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base/7 font-semibold text-masonic-gold">Payment Solutions</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Flexible payment solutions for your events
            </p>
            <p className="mt-6 text-lg/8 text-gray-600">
              LodgeTix is event management software that helps you manage your events, supporting the following payment solutions:
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base/7 font-semibold text-gray-900">
                  <CreditCard aria-hidden="true" className="size-5 flex-none text-masonic-gold" />
                  Share Payment Instructions
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base/7 text-gray-600">
                  <p className="flex-auto">
                    Display your lodge's bank account details directly on the registration page. Attendees can make 
                    direct transfers while you maintain full control of your funds. Our reconciliation dashboard helps 
                    you track payments against registrations with zero transaction fees.
                  </p>
                  <p className="mt-6">
                    <a href="/business/about/contact" className="text-sm/6 font-semibold text-masonic-gold">
                      Learn more <span aria-hidden="true">→</span>
                    </a>
                  </p>
                </dd>
              </div>
              
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base/7 font-semibold text-gray-900">
                  <Shield aria-hidden="true" className="size-5 flex-none text-masonic-gold" />
                  Integrate Payment Provider
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base/7 text-gray-600">
                  <p className="flex-auto">
                    Connect your existing Stripe or Square account to process payments directly. Funds settle straight 
                    to your bank account at your negotiated rates. You own the payment relationship and data while 
                    LodgeTix handles the event management workflow.
                  </p>
                  <p className="mt-6">
                    <a href="/business/about/contact" className="text-sm/6 font-semibold text-masonic-gold">
                      Learn more <span aria-hidden="true">→</span>
                    </a>
                  </p>
                </dd>
              </div>
              
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base/7 font-semibold text-gray-900">
                  <Users aria-hidden="true" className="size-5 flex-none text-masonic-gold" />
                  Take Payments as Your Agent
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base/7 text-gray-600">
                  <p className="flex-auto">
                    For lodges wanting a hands-off approach, we can collect payments on your behalf as a limited agent. 
                    This optional service includes risk-managed fund releases, comprehensive reconciliation, and dedicated 
                    support to ensure smooth payment collection for your events.
                  </p>
                  <p className="mt-6">
                    <a href="/business/about/contact" className="text-sm/6 font-semibold text-masonic-gold">
                      Learn more <span aria-hidden="true">→</span>
                    </a>
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Frequently Asked Questions</h2>
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-lg font-semibold leading-7 text-gray-900">{faq.question}</h3>
                <p className="mt-2 text-base leading-7 text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-masonic-navy">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to modernize your lodge events?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
              Join hundreds of lodges already using LodgeTix to save time and deliver exceptional member experiences.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg" className="bg-masonic-gold hover:bg-masonic-lightgold text-masonic-navy">
                <a href="/register">Start Free Trial</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-masonic-navy">
                <a href="/business/about/contact">Talk to Sales</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}