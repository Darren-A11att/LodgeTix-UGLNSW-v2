"use client"

import { useState } from 'react'
import { CheckIcon } from '@heroicons/react/20/solid'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PricingTier {
  name: string
  id: string
  href: string
  price: {
    monthly: string
    quarterly: string
    annual: string
  }
  attendeeRange: string
  description: string
  features: string[]
  mostPopular?: boolean
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Small',
    id: 'tier-small',
    href: '/contact',
    price: {
      monthly: '$10',
      quarterly: '$20',
      annual: '$20'
    },
    attendeeRange: '10-50 Attendees',
    description: 'Perfect for intimate lodge events and small gatherings',
    features: [
      'Up to 50 attendees per event',
      'Full registration management',
      'QR code check-in',
      'Basic payment processing',
      'Email confirmations',
      'Event reporting',
      'Mobile-friendly interface',
      'Template library access'
    ],
    mostPopular: false
  },
  {
    name: 'Medium',
    id: 'tier-medium',
    href: '/contact',
    price: {
      monthly: '$35',
      quarterly: '$45',
      annual: '$45'
    },
    attendeeRange: '51-99 Attendees',
    description: 'Ideal for regular lodge meetings and mid-sized functions',
    features: [
      'Up to 99 attendees per event',
      'All Small tier features',
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
    name: 'Large',
    id: 'tier-large',
    href: '/contact',
    price: {
      monthly: '$49',
      quarterly: '$59',
      annual: '$59'
    },
    attendeeRange: '100+ Attendees',
    description: 'Built for grand installations and major lodge events',
    features: [
      '100+ attendees per event',
      'All Medium tier features',
      'Unlimited ticket types',
      'Guest management system',
      'Advanced analytics dashboard',
      'API access',
      'Dedicated account manager',
      'Phone support'
    ],
    mostPopular: false
  }
]

const paymentOptions = [
  {
    title: 'Direct Payment',
    description: 'Accept payments directly to your lodge bank account',
    features: [
      'Display your bank details at registration',
      'Manual payment reconciliation',
      'No transaction fees',
      'Full control over funds'
    ]
  },
  {
    title: 'LodgeTix as Limited Agent',
    description: 'Let us handle payment processing on your behalf',
    features: [
      'Automated payment processing',
      'Weekly settlements to your account',
      'Reconciliation reports',
      'Customer support for payment queries'
    ]
  },
  {
    title: 'BYO Payment Gateway',
    description: 'Connect your own Stripe or Square account',
    features: [
      'Use your existing merchant account',
      'Direct settlements',
      'Your own transaction rates',
      'Full payment data ownership'
    ]
  }
]

const faqs = [
  {
    question: 'What happens if I need more attendees than my plan allows?',
    answer: 'You can upgrade your plan at any time or add the quarterly/annual upsize option for unlimited attendees.'
  },
  {
    question: 'Can I change plans later?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.'
  },
  {
    question: 'What\'s included in the template library?',
    answer: 'Access to professionally designed templates for tickets, certificates, programs, and other event materials. Printing services are available at an additional cost.'
  },
  {
    question: 'Do you offer discounts for multiple lodges?',
    answer: 'Yes, we offer custom pricing for Grand Lodges managing multiple subordinate lodges. Contact us for details.'
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No, there are no setup fees. You can start using LodgeTix immediately after signing up.'
  },
  {
    question: 'How does the free trial work?',
    answer: 'Try LodgeTix free for 30 days with full access to all features. No credit card required to start.'
  }
]

type BillingPeriod = 'monthly' | 'quarterly' | 'annual'

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary">Simple, transparent pricing</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Choose the right plan for your lodge
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              No transaction fees. No hidden costs. Just simple monthly pricing based on your event size.
            </p>
          </div>
        </div>
      </div>

      {/* Billing Period Toggle */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium transition-all',
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('quarterly')}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium transition-all',
                billingPeriod === 'quarterly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Quarterly (+$10)
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium transition-all',
                billingPeriod === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Annual (+$10)
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">
          Quarterly and Annual plans include unlimited attendees
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.id}
              className={cn(
                'relative flex flex-col',
                tier.mostPopular && 'border-primary shadow-lg'
              )}
            >
              {tier.mostPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="inline-flex rounded-full bg-primary px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="pb-8 pt-8">
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription className="mt-2">{tier.attendeeRange}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{tier.price[billingPeriod]}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="mt-4 text-sm text-gray-600">{tier.description}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckIcon className="h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="ml-3 text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.mostPopular ? 'default' : 'outline'}
                  size="lg"
                  asChild
                >
                  <a href={tier.href}>Start Free Trial</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Options */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Flexible Payment Options</h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose how you want to handle event payments
            </p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {paymentOptions.map((option) => (
              <div key={option.title} className="rounded-lg border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900">{option.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{option.description}</p>
                <ul className="mt-6 space-y-3">
                  {option.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-500" />
                      <span className="ml-3 text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Printed Materials Note */}
      <div className="bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-lg bg-blue-50 p-8">
            <h3 className="text-lg font-semibold text-blue-900">Professional Event Materials</h3>
            <p className="mt-2 text-blue-800">
              All plans include access to our template library for tickets, certificates, programs, and more.
              Need printed materials? We offer high-quality printing services at competitive rates.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <a href="/contact">Get Printing Quote</a>
            </Button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          <div className="mt-12 space-y-8">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                <p className="mt-2 text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to modernize your lodge events?</h2>
          <p className="mt-4 text-lg text-blue-100">
            Start your 30-day free trial today. No credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href="/register">Start Free Trial</a>
            </Button>
            <Button size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-primary" asChild>
              <a href="/contact">Talk to Sales</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}