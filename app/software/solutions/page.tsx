'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Calendar, 
  Award, 
  Heart, 
  Building2, 
  Sparkles,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Shield,
  CreditCard,
  Megaphone
} from 'lucide-react';

const eventTypeSolutions = [
  {
    id: 'installation',
    title: 'Installation Ceremonies',
    icon: Award,
    challenges: [
      'Managing VIP guest lists and dignitaries',
      'Coordinating dining seating arrangements',
      'Tracking regalia and ceremonial requirements',
      'Handling last-minute protocol changes'
    ],
    features: [
      'VIP guest management with special requirements tracking',
      'Automated seating charts with lodge hierarchy',
      'Regalia and dietary requirement collection',
      'Real-time attendee communication system'
    ],
    metrics: {
      timeReduction: '75%',
      guestSatisfaction: '95%',
      adminHours: '10hrs saved'
    }
  },
  {
    id: 'festive',
    title: 'Festive Boards',
    icon: Sparkles,
    challenges: [
      'Collecting dietary requirements efficiently',
      'Managing plus-one invitations',
      'Tracking prepayments and walk-ins',
      'Coordinating with catering staff'
    ],
    features: [
      'Comprehensive dietary requirement forms',
      'Guest invitation system with RSVP tracking',
      'Flexible payment options including at-door',
      'Catering reports with meal breakdowns'
    ],
    metrics: {
      rsvpRate: '85%',
      cateringAccuracy: '99%',
      checkInTime: '< 30 sec'
    }
  },
  {
    id: 'degree',
    title: 'Degree Ceremonies',
    icon: Users,
    challenges: [
      'Verifying member standing and eligibility',
      'Managing visitor registrations',
      'Tracking attendance for records',
      'Coordinating multiple lodge participants'
    ],
    features: [
      'Member verification system',
      'Visitor pre-registration with lodge details',
      'Automated attendance records for minutes',
      'Multi-lodge coordination tools'
    ],
    metrics: {
      verificationTime: '90% faster',
      recordAccuracy: '100%',
      visitorSatisfaction: '4.9/5'
    }
  },
  {
    id: 'ladies',
    title: "Ladies' Nights",
    icon: Heart,
    challenges: [
      'Managing non-member guest lists',
      'Coordinating special entertainment',
      'Handling varied dietary preferences',
      'Creating memorable experiences'
    ],
    features: [
      'Guest-friendly registration process',
      'Entertainment preference collection',
      'Comprehensive dietary and accessibility options',
      'Photo sharing and memory book features'
    ],
    metrics: {
      guestEngagement: '92%',
      repeatAttendance: '78%',
      netPromoterScore: '85'
    }
  },
  {
    id: 'charitable',
    title: 'Charitable Events',
    icon: Heart,
    challenges: [
      'Processing donations efficiently',
      'Tracking fundraising goals',
      'Managing volunteer coordination',
      'Reporting to stakeholders'
    ],
    features: [
      'Integrated donation processing',
      'Real-time fundraising thermometer',
      'Volunteer registration and scheduling',
      'Automated tax receipt generation'
    ],
    metrics: {
      donationIncrease: '45%',
      processingCost: '-60%',
      donorRetention: '82%'
    }
  },
  {
    id: 'grand',
    title: 'Grand Lodge Events',
    icon: Building2,
    challenges: [
      'Managing hundreds of attendees',
      'Coordinating multiple concurrent sessions',
      'Handling complex accommodation needs',
      'Ensuring security and protocol'
    ],
    features: [
      'Multi-track session management',
      'Accommodation booking integration',
      'Credential and access control system',
      'Protocol and precedence automation'
    ],
    metrics: {
      registrationTime: '-80%',
      attendeeSatisfaction: '96%',
      dataAccuracy: '99.9%'
    }
  }
];

const lodgeSizeSolutions = [
  {
    id: 'small',
    title: 'Small Lodges',
    range: '10-50 members',
    icon: Users,
    challenges: [
      'Limited administrative resources',
      'Budget constraints',
      'Member engagement',
      'Technology adoption'
    ],
    features: [
      'Simple, intuitive interface requiring no training',
      'Affordable pricing with no setup fees',
      'Mobile-first design for easy access',
      'Automated reminders to boost attendance'
    ],
    benefits: [
      'Save 5+ hours per event',
      'Increase attendance by 25%',
      'Reduce no-shows by 40%',
      'Zero technical support needed'
    ],
    pricing: 'From $29/month'
  },
  {
    id: 'medium',
    title: 'Medium Lodges',
    range: '51-99 members',
    icon: Users,
    challenges: [
      'Growing complexity of events',
      'Multiple committee members',
      'Diverse member demographics',
      'Balancing tradition with innovation'
    ],
    features: [
      'Multi-user access with role permissions',
      'Customizable registration forms',
      'Integrated communication tools',
      'Detailed analytics and reporting'
    ],
    benefits: [
      'Streamline committee collaboration',
      'Accommodate all member preferences',
      'Track trends and improve events',
      'Scale without adding overhead'
    ],
    pricing: 'From $79/month'
  },
  {
    id: 'large',
    title: 'Large Lodges',
    range: '100+ members',
    icon: Building2,
    challenges: [
      'Complex event logistics',
      'Multiple concurrent events',
      'Detailed financial tracking',
      'Member segmentation needs'
    ],
    features: [
      'Advanced event templates and cloning',
      'Sophisticated financial reporting',
      'Member database integration',
      'API access for custom integrations'
    ],
    benefits: [
      'Manage multiple events effortlessly',
      'Complete financial transparency',
      'Personalized member experiences',
      'Integrate with existing systems'
    ],
    pricing: 'From $149/month'
  },
  {
    id: 'district',
    title: 'District/Provincial Events',
    range: 'Multi-lodge coordination',
    icon: Building2,
    challenges: [
      'Coordinating multiple lodges',
      'Complex registration rules',
      'Large-scale logistics',
      'Compliance and reporting'
    ],
    features: [
      'Multi-lodge registration management',
      'Hierarchical access controls',
      'Bulk invitation and communication',
      'Comprehensive compliance reporting'
    ],
    benefits: [
      'Centralized event management',
      'Maintain lodge autonomy',
      'Reduce coordination overhead by 70%',
      'Ensure regulatory compliance'
    ],
    pricing: 'Custom pricing'
  }
];

export default function SolutionsPage() {
  const [activeTab, setActiveTab] = useState<'event-type' | 'lodge-size'>('event-type');
  const [selectedEvent, setSelectedEvent] = useState(eventTypeSolutions[0].id);
  const [selectedSize, setSelectedSize] = useState(lodgeSizeSolutions[0].id);

  const activeEvent = eventTypeSolutions.find(e => e.id === selectedEvent) || eventTypeSolutions[0];
  const activeSize = lodgeSizeSolutions.find(s => s.id === selectedSize) || lodgeSizeSolutions[0];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Tailored Solutions for Every Masonic Event
            </h1>
            <p className="text-xl opacity-90 mb-8">
              From intimate degree ceremonies to grand installations, LodgeTix adapts to your lodge's unique needs
            </p>
          </div>
        </div>
      </section>

      {/* Event Distribution Platform */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Your Events, Discovered by Thousands
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Every event you create is automatically listed on the <span className="font-semibold">LodgeTix Events Page</span> - 
              our central marketplace where members browse and discover Masonic events across all lodges.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <Megaphone className="w-10 h-10 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Instant Distribution</h3>
                <p className="text-gray-600">Your events go live on the LodgeTix events page immediately upon creation</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <Users className="w-10 h-10 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Broader Reach</h3>
                <p className="text-gray-600">Members discover your events while browsing other lodge activities</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <Building2 className="w-10 h-10 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Complete Infrastructure</h3>
                <p className="text-gray-600">No need to build your own event website - we provide everything</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="inline-flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('event-type')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'event-type'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Solutions by Event Type
              </button>
              <button
                onClick={() => setActiveTab('lodge-size')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'lodge-size'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Solutions by Lodge Size
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      {activeTab === 'event-type' ? (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Event Type Selector */}
              <div className="md:col-span-1">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Select Event Type</h3>
                <div className="space-y-2">
                  {eventTypeSolutions.map((event) => {
                    const Icon = event.icon;
                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event.id)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          selectedEvent === event.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-5 h-5 ${
                            selectedEvent === event.id ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            selectedEvent === event.id ? 'text-blue-900' : 'text-gray-700'
                          }`}>
                            {event.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Event Details */}
              <div className="md:col-span-2">
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <activeEvent.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{activeEvent.title}</h2>
                  </div>

                  {/* Challenges */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Common Challenges</h3>
                    <ul className="space-y-2">
                      {activeEvent.challenges.map((challenge, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <Shield className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Solutions */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">How LodgeTix Helps</h3>
                    <ul className="space-y-3">
                      {activeEvent.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Success Metrics */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Success Metrics</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center space-x-1 text-2xl font-bold text-blue-600">
                          <TrendingUp className="w-5 h-5" />
                          <span>{activeEvent.metrics.timeReduction || activeEvent.metrics.rsvpRate}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {activeEvent.metrics.timeReduction ? 'Time Saved' : 'RSVP Rate'}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center space-x-1 text-2xl font-bold text-green-600">
                          <Users className="w-5 h-5" />
                          <span>{activeEvent.metrics.guestSatisfaction || activeEvent.metrics.cateringAccuracy}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {activeEvent.metrics.guestSatisfaction ? 'Satisfaction' : 'Accuracy'}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center space-x-1 text-2xl font-bold text-purple-600">
                          <Clock className="w-5 h-5" />
                          <span>{activeEvent.metrics.adminHours || activeEvent.metrics.checkInTime}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {activeEvent.metrics.adminHours ? 'Admin Time' : 'Check-in Time'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-8 flex space-x-4">
                    <Link
                      href="/software/demo"
                      className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                    >
                      See It In Action
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                    <Link
                      href="/software/contact"
                      className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 transition"
                    >
                      Discuss Your Event
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Lodge Size Selector */}
              <div className="md:col-span-1">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Select Lodge Size</h3>
                <div className="space-y-2">
                  {lodgeSizeSolutions.map((size) => {
                    const Icon = size.icon;
                    return (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size.id)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          selectedSize === size.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-5 h-5 ${
                            selectedSize === size.id ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <span className={`font-medium block ${
                              selectedSize === size.id ? 'text-blue-900' : 'text-gray-700'
                            }`}>
                              {size.title}
                            </span>
                            <span className="text-sm text-gray-500">{size.range}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Details */}
              <div className="md:col-span-2">
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <activeSize.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{activeSize.title}</h2>
                      <p className="text-gray-600">{activeSize.range}</p>
                    </div>
                  </div>

                  {/* Challenges */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Typical Challenges</h3>
                    <ul className="space-y-2">
                      {activeSize.challenges.map((challenge, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <Shield className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Features */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Tailored Features</h3>
                    <ul className="space-y-3">
                      {activeSize.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Key Benefits</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {activeSize.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700">Investment</h3>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{activeSize.pricing}</p>
                      </div>
                      <CreditCard className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-8 flex space-x-4">
                    <Link
                      href="/software/pricing"
                      className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                    >
                      View Pricing Details
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                    <Link
                      href="/software/demo"
                      className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 transition"
                    >
                      Request Demo
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonial Placeholder */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              Trusted by Lodges Across Australia
            </h2>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <blockquote className="text-lg text-gray-600 italic mb-6">
                "LodgeTix transformed how we manage our Installation ceremonies. What used to take days of preparation
                now takes hours, and our members love the professional experience."
              </blockquote>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">W.Bro. John Smith</p>
                  <p className="text-sm text-gray-600">Secretary, Example Lodge No. 123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Lodge Events?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Join hundreds of lodges already using LodgeTix to create memorable, well-organised events
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/software/demo"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-900 font-semibold rounded-lg hover:bg-gray-100 transition"
              >
                Schedule a Demo
                <Calendar className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/software/contact"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-900 transition"
              >
                Contact Sales
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}