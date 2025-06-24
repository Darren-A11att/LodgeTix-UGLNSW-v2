'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MasonicLogo } from '@/components/masonic-logo'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { CloudArrowUpIcon, LockClosedIcon, ServerIcon, BuildingOffice2Icon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { CheckIcon, MinusIcon } from '@heroicons/react/20/solid'
import { ArrowLeft, Check, Minus, Plus } from 'lucide-react'
import { Fragment } from 'react'

interface SponsorshipPageProps {
  functionData: {
    id: string
    name: string
    slug: string
    description?: string
  }
}

const features = [
  {
    name: 'Premium Branding',
    description: 'Your logo featured prominently on all event materials, signage, and digital platforms.',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'Exclusive Networking',
    description: 'Private access to VIP networking sessions with key attendees and speakers.',
    icon: LockClosedIcon,
  },
  {
    name: 'Speaking Opportunities',
    description: 'Platform to present your expertise to our engaged audience.',
    icon: ServerIcon,
  },
]

const stats = [
  { id: 1, name: 'Attendees Expected', value: '500+' },
  { id: 2, name: 'Industry Leaders', value: '100+' },
  { id: 3, name: 'Networking Hours', value: '20+' },
  { id: 4, name: 'Media Reach', value: '10K+' },
]

const timeline = [
  {
    name: 'Early Bird Special',
    description: 'Lock in your sponsorship at a discounted rate before the early bird deadline.',
    date: '3 months before',
    dateTime: '2024-03',
  },
  {
    name: 'Marketing Launch',
    description: 'Your brand featured in all pre-event marketing and promotional materials.',
    date: '2 months before',
    dateTime: '2024-04',
  },
  {
    name: 'Event Days',
    description: 'Maximum exposure and engagement opportunities during the event.',
    date: 'Event dates',
    dateTime: '2024-06',
  },
  {
    name: 'Post-Event Report',
    description: 'Comprehensive analytics and ROI report delivered to measure your success.',
    date: '2 weeks after',
    dateTime: '2024-07',
  },
]

const productFeatures = [
  {
    name: 'Brand Visibility',
    description: 'Logo placement on all event materials, website, and promotional campaigns.',
  },
  {
    name: 'Lead Generation',
    description: 'Access to attendee list and dedicated booth space for direct engagement.',
  },
  {
    name: 'Content Marketing',
    description: 'Speaking slots, workshop opportunities, and inclusion in event content.',
  },
  { 
    name: 'Digital Presence', 
    description: 'Featured on event website, social media campaigns, and email marketing.' 
  },
]

const tiers = [
  {
    id: 'bronze',
    name: 'Bronze',
    price: { event: '$2,500', annual: '$20,000' },
    description: 'Essential sponsorship package for emerging brands.',
    features: ['Logo on event website', 'Social media mentions', 'Standard booth space', 'Attendee list access'],
    featured: false,
  },
  {
    id: 'silver',
    name: 'Silver',
    price: { event: '$5,000', annual: '$40,000' },
    description: 'Enhanced visibility and engagement opportunities.',
    features: [
      'All Bronze benefits',
      'Premium booth location',
      'Speaking opportunity',
      'Logo on event signage',
      'Email campaign inclusion',
    ],
    featured: true,
  },
  {
    id: 'gold',
    name: 'Gold',
    price: { event: '$10,000', annual: '$80,000' },
    description: 'Maximum exposure and exclusive benefits.',
    features: [
      'All Silver benefits',
      'Keynote speaking slot',
      'VIP networking access',
      'Dedicated marketing campaign',
      'Post-event analytics report',
      'Custom activation opportunities',
    ],
    featured: false,
  },
]

const faqs = [
  {
    question: "What are the benefits of becoming a sponsor?",
    answer:
      "As a sponsor, you'll gain direct access to our engaged community, premium brand visibility, networking opportunities with industry leaders, and measurable ROI through lead generation and brand awareness.",
  },
  {
    question: "Can we customize our sponsorship package?",
    answer:
      "Absolutely! We understand that every organization has unique goals. Our sponsorship team will work with you to create a custom package that aligns with your objectives and budget.",
  },
  {
    question: "What is included in the post-event report?",
    answer:
      "The post-event report includes detailed analytics on attendee engagement, brand visibility metrics, lead generation data, social media reach, and recommendations for future sponsorship optimization.",
  },
]

function classNames(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function SponsorshipPage({ functionData }: SponsorshipPageProps) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Link href={`/functions/${functionData.slug}`} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to {functionData.name}
                </Link>
              </Button>
              <Link href="/" className="flex items-center gap-2">
                <MasonicLogo size="sm" />
                <span className="text-lg font-semibold">LodgeTix</span>
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-4">
              <Button asChild variant="outline">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="#contact">Contact Sponsorship Team</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gray-900">
        <img
          alt=""
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2830&q=80&blend=111827&sat=-100&exp=15&blend-mode=multiply"
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[72.1875rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm/6 text-gray-400 ring-1 ring-white/10 hover:ring-white/20">
                Become a sponsor of {functionData.name}
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-5xl font-semibold tracking-tight text-balance text-white sm:text-7xl">
                Sponsor {functionData.name}
              </h1>
              <p className="mt-8 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
                Partner with us to make {functionData.name} an unforgettable experience. Reach our engaged community and showcase your brand to the right audience.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <a
                  href="#packages"
                  className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                >
                  View Packages
                </a>
                <a href="#contact" className="text-sm/6 font-semibold text-white">
                  Contact us <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[72.1875rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          />
        </div>
      </div>

      {/* Section 1 - Features */}
      <div className="overflow-hidden bg-gray-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            <div className="lg:pt-4 lg:pr-8">
              <div className="lg:max-w-lg">
                <h2 className="text-base/7 font-semibold text-indigo-400">Sponsor with impact</h2>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">
                  Maximum exposure, meaningful connections
                </p>
                <p className="mt-6 text-lg/8 text-gray-300">
                  Join us as a sponsor and connect with industry leaders, decision makers, and influential professionals in an exclusive setting.
                </p>
                <dl className="mt-10 max-w-xl space-y-8 text-base/7 text-gray-300 lg:max-w-none">
                  {features.map((feature) => (
                    <div key={feature.name} className="relative pl-9">
                      <dt className="inline font-semibold text-white">
                        <feature.icon aria-hidden="true" className="absolute top-1 left-1 size-5 text-indigo-500" />
                        {feature.name}
                      </dt>{' '}
                      <dd className="inline">{feature.description}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            <img
              alt="Sponsorship benefits"
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2850&q=80"
              width={2432}
              height={1442}
              className="w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-white/10 sm:w-[57rem] md:-ml-4 lg:-ml-0"
            />
          </div>
        </div>
      </div>

      {/* White Sections Group */}
      <div className="bg-white">
        {/* Section 2 - Stats */}
        <div className="relative">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8">
            <div className="mx-auto max-w-2xl lg:max-w-none">
              <h2 className="text-base/8 font-semibold text-indigo-600">Event Impact</h2>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl">
                Reach the right audience
              </p>
              <p className="mt-6 text-lg/8 text-gray-600">
                Our events consistently deliver exceptional value for sponsors, with proven ROI and meaningful business connections.
              </p>
              <dl className="mt-16 grid max-w-xl grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2 xl:mt-16 lg:max-w-none lg:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.id} className="flex flex-col gap-y-3 border-l border-gray-900/10 pl-6">
                    <dt className="text-sm/6 text-gray-600">{stat.name}</dt>
                    <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Section 3 - Timeline */}
        <div className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:max-w-none">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Sponsorship Timeline</h2>
              <p className="mt-6 text-lg text-gray-600">
                Our structured timeline ensures maximum value and exposure throughout your sponsorship journey.
              </p>
              <div className="mt-16 grid max-w-2xl grid-cols-1 gap-8 overflow-hidden lg:mx-0 lg:max-w-none lg:grid-cols-4">
                {timeline.map((item) => (
                  <div key={item.name}>
                    <time dateTime={item.dateTime} className="flex items-center text-sm/6 font-semibold text-indigo-600">
                      <svg viewBox="0 0 4 4" aria-hidden="true" className="mr-4 size-1 flex-none">
                        <circle r={2} cx={2} cy={2} fill="currentColor" />
                      </svg>
                      {item.date}
                      <div
                        aria-hidden="true"
                        className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0"
                      />
                    </time>
                    <p className="mt-6 text-lg/8 font-semibold tracking-tight text-gray-900">{item.name}</p>
                    <p className="mt-1 text-base/7 text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4 - Benefits */}
        <div className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:max-w-none">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Comprehensive Sponsorship Benefits
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  We've carefully designed our sponsorship packages to deliver maximum value and ROI for your investment.
                </p>
              </div>
              <dl className="mt-16 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {productFeatures.map((feature) => (
                  <div key={feature.name}>
                    <dt className="font-medium text-gray-900">{feature.name}</dt>
                    <dd className="mt-2 text-sm text-gray-600">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Dark Sections Group */}
      <div className="bg-gray-900">
        {/* Section 5 - Pricing Tiers */}
        <div className="py-16 sm:py-24" id="packages">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-base/7 font-semibold text-indigo-400">Sponsorship Packages</h2>
              <p className="mt-2 text-5xl font-semibold tracking-tight text-balance text-white sm:text-6xl">
                Choose your level of partnership
              </p>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
              Select a sponsorship package that aligns with your marketing objectives and budget. All packages can be customized to meet your specific needs.
            </p>
            <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={classNames(
                    tier.featured ? 'bg-white/5 ring-2 ring-indigo-500' : 'ring-1 ring-white/10',
                    'rounded-3xl p-8 xl:p-10'
                  )}
                >
                  <div className="flex items-center justify-between gap-x-4">
                    <h3 id={`tier-${tier.id}`} className="text-lg/8 font-semibold text-white">
                      {tier.name}
                    </h3>
                    {tier.featured && (
                      <p className="rounded-full bg-indigo-500 px-2.5 py-1 text-xs/5 font-semibold text-white">
                        Most popular
                      </p>
                    )}
                  </div>
                  <p className="mt-4 text-sm/6 text-gray-300">{tier.description}</p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-4xl font-semibold tracking-tight text-white">{tier.price.event}</span>
                    <span className="text-sm/6 font-semibold text-gray-300">/event</span>
                  </p>
                  <Button asChild className="mt-6 w-full" variant={tier.featured ? "default" : "outline"}>
                    <Link href="#contact">Get Started</Link>
                  </Button>
                  <ul role="list" className="mt-8 space-y-3 text-sm/6 text-gray-300 xl:mt-10">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-white" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 6 - FAQ */}
        <div className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Frequently asked questions</h2>
              <dl className="mt-16 divide-y divide-white/10">
                {faqs.map((faq) => (
                  <Collapsible key={faq.question} className="py-6 first:pt-0 last:pb-0">
                    <dt>
                      <CollapsibleTrigger className="group flex w-full items-start justify-between text-left text-white">
                        <span className="text-base/7 font-semibold">{faq.question}</span>
                        <span className="ml-6 flex h-7 items-center">
                          <Plus aria-hidden="true" className="size-6 group-data-[state=closed]:block group-data-[state=open]:hidden" />
                          <Minus aria-hidden="true" className="size-6 group-data-[state=open]:block group-data-[state=closed]:hidden" />
                        </span>
                      </CollapsibleTrigger>
                    </dt>
                    <CollapsibleContent asChild>
                      <dd className="mt-2 pr-12">
                        <p className="text-base/7 text-gray-300">{faq.answer}</p>
                      </dd>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Section 7 - Contact */}
        <div className="relative isolate py-16 sm:py-24" id="contact">
          <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
            <div className="relative px-6 pb-20 pt-24 sm:pt-32 lg:static lg:px-8 lg:py-48">
              <div className="mx-auto max-w-xl lg:mx-0 lg:max-w-lg">
                <h2 className="text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">
                  Ready to become a sponsor?
                </h2>
                <p className="mt-6 text-lg/8 text-gray-300">
                  Our sponsorship team is here to help you create a customized package that meets your goals and maximizes your ROI.
                </p>
                <dl className="mt-10 space-y-4 text-base/7 text-gray-300">
                  <div className="flex gap-x-4">
                    <dt className="flex-none">
                      <span className="sr-only">Address</span>
                      <BuildingOffice2Icon aria-hidden="true" className="h-7 w-6 text-gray-400" />
                    </dt>
                    <dd>
                      United Grand Lodge of NSW & ACT
                      <br />
                      Sydney, NSW
                    </dd>
                  </div>
                  <div className="flex gap-x-4">
                    <dt className="flex-none">
                      <span className="sr-only">Telephone</span>
                      <PhoneIcon aria-hidden="true" className="h-7 w-6 text-gray-400" />
                    </dt>
                    <dd>
                      <a href="tel:+61 2 9284 2800" className="hover:text-white">
                        +61 2 9284 2800
                      </a>
                    </dd>
                  </div>
                  <div className="flex gap-x-4">
                    <dt className="flex-none">
                      <span className="sr-only">Email</span>
                      <EnvelopeIcon aria-hidden="true" className="h-7 w-6 text-gray-400" />
                    </dt>
                    <dd>
                      <a href="mailto:sponsorship@lodgetix.com" className="hover:text-white">
                        sponsorship@lodgetix.com
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <form action="#" method="POST" className="px-6 pb-24 pt-20 sm:pb-32 lg:px-8 lg:py-48">
              <div className="mx-auto max-w-xl lg:mr-0 lg:max-w-lg">
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="first-name" className="block text-sm/6 font-semibold text-white">
                      First name
                    </label>
                    <div className="mt-2.5">
                      <input
                        id="first-name"
                        name="first-name"
                        type="text"
                        autoComplete="given-name"
                        className="block w-full rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-sm/6 font-semibold text-white">
                      Last name
                    </label>
                    <div className="mt-2.5">
                      <input
                        id="last-name"
                        name="last-name"
                        type="text"
                        autoComplete="family-name"
                        className="block w-full rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="email" className="block text-sm/6 font-semibold text-white">
                      Email
                    </label>
                    <div className="mt-2.5">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        className="block w-full rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="company" className="block text-sm/6 font-semibold text-white">
                      Company
                    </label>
                    <div className="mt-2.5">
                      <input
                        id="company"
                        name="company"
                        type="text"
                        autoComplete="organization"
                        className="block w-full rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="phone-number" className="block text-sm/6 font-semibold text-white">
                      Phone number
                    </label>
                    <div className="mt-2.5">
                      <input
                        id="phone-number"
                        name="phone-number"
                        type="tel"
                        autoComplete="tel"
                        className="block w-full rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="message" className="block text-sm/6 font-semibold text-white">
                      Message
                    </label>
                    <div className="mt-2.5">
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        className="block w-full rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                        placeholder="Tell us about your sponsorship goals..."
                        defaultValue={''}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <Button type="submit" size="lg">
                    Send message
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}