import Link from "next/link"
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import { LifebuoyIcon, NewspaperIcon, PhoneIcon } from '@heroicons/react/20/solid'

import { Button } from "@/components/ui/button"
import { AboutContent } from "@/components/about"

// Mark as dynamic since AboutContent uses server-side data fetching
export const dynamic = 'force-dynamic'

const supportCards = [
  {
    name: 'For Brethren',
    description: 'Easy event discovery, registration, and ticket management for all Masonic events.',
    icon: LifebuoyIcon,
  },
  {
    name: 'For Lodges',
    description: 'Comprehensive event management tools designed specifically for Masonic organizations.',
    icon: PhoneIcon,
  },
  {
    name: 'Secure Platform',
    description: 'Built with security and privacy in mind, respecting Masonic traditions and values.',
    icon: NewspaperIcon,
  },
]

export default function AboutPage() {
  return (
    <div>
      {/* Header Section */}
      <div className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
        <img
          alt=""
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&crop=focalpoint&fp-y=.8&w=2830&h=1500&q=80&blend=111827&sat=-100&exp=15&blend-mode=multiply"
          className="absolute inset-0 -z-10 size-full object-cover object-right md:object-center"
        />
        <div className="hidden sm:absolute sm:-top-10 sm:right-1/2 sm:-z-10 sm:mr-10 sm:block sm:transform-gpu sm:blur-3xl">
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="aspect-1097/845 w-274.25 bg-linear-to-tr from-[#ff4694] to-[#776fff] opacity-20"
          />
        </div>
        <div className="absolute -top-52 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl sm:top-[-28rem] sm:ml-16 sm:translate-x-0 sm:transform-gpu">
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="aspect-1097/845 w-274.25 bg-linear-to-tr from-[#ff4694] to-[#776fff] opacity-20"
          />
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl">About LodgeTix</h2>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
              The premier platform for Masonic event management and ticketing, created by Freemasons for Freemasons. 
              Connecting Brethren through meaningful events and memorable experiences.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
            {supportCards.map((card) => (
              <div key={card.name} className="flex gap-x-4 rounded-xl bg-white/5 p-6 ring-1 ring-white/10 ring-inset">
                <card.icon aria-hidden="true" className="h-7 w-5 flex-none text-indigo-400" />
                <div className="text-base/7">
                  <h3 className="font-semibold text-white">{card.name}</h3>
                  <p className="mt-2 text-gray-300">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white px-6 py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-base/7 text-gray-700">
          <p className="text-base/7 font-semibold text-indigo-600">Our Mission</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl">
            Connecting the Masonic Community
          </h1>
          <p className="mt-6 text-xl/8">
            LodgeTix was born from a vision to modernize and streamline Masonic event management while preserving 
            the time-honored traditions and values that define our fraternity.
          </p>
          <div className="mt-10 max-w-2xl">
            
            {/* Dynamic About Content from Supabase */}
            <AboutContent />
            
            <ul role="list" className="mt-8 max-w-xl space-y-8 text-gray-600">
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-600" />
                <span>
                  <strong className="font-semibold text-gray-900">Secure & Private.</strong> Built with Masonic 
                  values in mind, ensuring your information remains confidential and secure.
                </span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-600" />
                <span>
                  <strong className="font-semibold text-gray-900">Easy Registration.</strong> Streamlined 
                  registration process designed specifically for Masonic events and requirements.
                </span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-600" />
                <span>
                  <strong className="font-semibold text-gray-900">Lodge Management.</strong> Comprehensive 
                  tools for Lodges to manage their events, registrations, and communications.
                </span>
              </li>
            </ul>
            <p className="mt-8">
              Whether you're a Brother looking to attend upcoming events or a Lodge Secretary managing registrations, 
              LodgeTix provides the tools and support you need. Our platform respects Masonic traditions while 
              embracing modern technology to serve our community better.
            </p>
            <h2 className="mt-16 text-3xl font-semibold tracking-tight text-pretty text-gray-900">
              Built by Freemasons, for Freemasons
            </h2>
            <p className="mt-6">
              Our development team understands the unique needs of Masonic organizations because we are part of 
              the fraternity. This deep understanding allows us to create features that truly serve the Masonic 
              community while maintaining the highest standards of security and privacy.
            </p>
            <p className="mt-8">
              From Grand Proclamations to Lodge meetings, installation ceremonies to social events, LodgeTix 
              supports the full spectrum of Masonic activities with tools designed to enhance rather than 
              complicate your event management experience.
            </p>
          </div>
          <div className="mt-16 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-pretty text-gray-900">
              Ready to Get Started?
            </h2>
            <p className="mt-6">
              Join the growing number of Lodges across NSW & ACT using LodgeTix to manage their Masonic events. 
              Whether you're planning your next Lodge meeting or preparing for a major celebration, we're here 
              to help make your event management seamless and successful.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild variant="outline" size="lg">
                <Link href="/organiser/signup">Register Your Lodge</Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}