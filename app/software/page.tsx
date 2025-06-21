"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MasonicLogo } from '@/components/masonic-logo';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Mail, 
  FileText,
  CheckCircle2,
  Clock,
  Shield,
  Zap,
  ArrowRight,
  UserCheck,
  Megaphone,
  MessageSquare,
  Handshake,
  FileBarChart
} from 'lucide-react';

// TypeScript interfaces
interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Problem {
  issue: string;
  solution: string;
}

interface Benefit {
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Rotating taglines component
function RotatingTaglines() {
  const taglines = [
    "Streamline Your Lodge Events",
    "Simplify Registration Management",
    "Enhance Member Experience",
    "Save Time, Focus on Brotherhood",
    "Professional Event Management Made Easy"
  ];

  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % taglines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [taglines.length]);

  return (
    <div className="h-8 relative overflow-hidden">
      {taglines.map((tagline, index) => (
        <p
          key={index}
          className={`absolute inset-0 text-xl text-masonic-gold transition-all duration-500 ${
            index === currentIndex
              ? 'opacity-100 transform translate-y-0'
              : 'opacity-0 transform -translate-y-full'
          }`}
        >
          {tagline}
        </p>
      ))}
    </div>
  );
}

export default function SoftwareLandingPage() {
  const features: Feature[] = [
    {
      title: "Registrations",
      description: "Manage member and guest registrations with ease. Handle individual, lodge, and group bookings seamlessly.",
      icon: <Users className="h-6 w-6" />
    },
    {
      title: "Check In & Badging",
      description: "Quick QR code check-in system with automated badge printing for smooth event entry.",
      icon: <UserCheck className="h-6 w-6" />
    },
    {
      title: "Event Marketing & Distribution",
      description: "Your events are automatically listed on the LodgeTix events page where thousands of members discover and register.",
      icon: <Megaphone className="h-6 w-6" />
    },
    {
      title: "Attendee Management & Communication",
      description: "Keep attendees informed with automated emails and real-time updates.",
      icon: <MessageSquare className="h-6 w-6" />
    },
    {
      title: "Sponsorship Management",
      description: "Track and manage event sponsors, packages, and benefits in one place.",
      icon: <Handshake className="h-6 w-6" />
    },
    {
      title: "Printed Materials & Collateral",
      description: "Generate event programs, certificates, and badges automatically.",
      icon: <FileText className="h-6 w-6" />
    },
    {
      title: "Reporting & Insights",
      description: "Comprehensive analytics and reports to measure event success and attendee engagement.",
      icon: <FileBarChart className="h-6 w-6" />
    }
  ];

  const problems: Problem[] = [
    {
      issue: "Manual registration tracking in spreadsheets",
      solution: "Automated online registration system with real-time updates"
    },
    {
      issue: "Time-consuming check-in processes",
      solution: "Instant QR code check-in with automated badge printing"
    },
    {
      issue: "Difficulty communicating with attendees",
      solution: "Integrated email system with automated confirmations and reminders"
    },
    {
      issue: "Managing dietary requirements and special needs",
      solution: "Comprehensive attendee profiles with all requirements in one place"
    },
    {
      issue: "Tracking sponsorships and benefits",
      solution: "Dedicated sponsorship management dashboard"
    },
    {
      issue: "Creating consistent event materials",
      solution: "Automated generation of programs, certificates, and badges"
    }
  ];

  const benefits: Benefit[] = [
    {
      title: "Save 10+ Hours Per Event",
      description: "Automate repetitive tasks and focus on delivering exceptional experiences",
      icon: <Clock className="h-8 w-8" />
    },
    {
      title: "Reduce Errors by 95%",
      description: "Eliminate manual data entry mistakes with automated systems",
      icon: <CheckCircle2 className="h-8 w-8" />
    },
    {
      title: "Enhance Member Satisfaction",
      description: "Provide a professional, seamless experience from registration to check-in",
      icon: <Users className="h-8 w-8" />
    },
    {
      title: "Secure & Compliant",
      description: "Bank-level security with full compliance for member data protection",
      icon: <Shield className="h-8 w-8" />
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <MasonicLogo size="sm" />
              <span className="text-lg font-semibold text-masonic-navy">LodgeTix</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/software/features" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
                Features
              </Link>
              <Link href="/software/pricing" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
                Pricing
              </Link>
              <Link href="/software/solutions" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
                Solutions
              </Link>
              <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
                Contact
              </Link>
              <Button asChild variant="outline" className="border-masonic-gold text-masonic-gold hover:bg-masonic-gold hover:text-white">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-masonic-navy hover:bg-masonic-blue text-white">
                <Link href="/register">Start Free Trial</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-masonic-navy via-masonic-blue to-masonic-navy py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Masonic Event Management Software
            </h1>
            <RotatingTaglines />
            <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto">
              Purpose-built for Masonic lodges and organizations. Manage registrations, 
              check-ins, communications, and more - all in one secure platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-masonic-gold hover:bg-masonic-lightgold text-masonic-navy font-semibold">
                <Link href="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-masonic-navy">
                <Link href="/contact">Book a Demo</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              No credit card required • 30-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-masonic-navy mb-4">
              Everything You Need to Run Successful Lodge Events
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive tools designed specifically for Masonic organizations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-masonic-lightblue rounded-lg text-masonic-navy">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-masonic-navy">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Problem-Solution Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-masonic-navy mb-4">
              Common Lodge Challenges We Solve
            </h2>
            <p className="text-xl text-gray-600">
              Transform time-consuming manual processes into efficient automated workflows
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {problems.map((problem, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold">✗</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <p className="text-gray-600 line-through mb-2">{problem.issue}</p>
                  <div className="flex gap-2 items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-masonic-navy font-medium">{problem.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-masonic-lightblue">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-masonic-navy mb-4">
              The LodgeTix Advantage
            </h2>
            <p className="text-xl text-gray-600">
              Join lodges saving hours and delivering better member experiences
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center p-4 bg-white rounded-full text-masonic-gold mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-masonic-navy mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-masonic-navy">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Lodge Events?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join the growing number of Masonic lodges using LodgeTix to deliver 
            exceptional event experiences while saving valuable time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-masonic-gold hover:bg-masonic-lightgold text-masonic-navy font-semibold">
              <Link href="/register">
                Start Your Free Trial
                <Zap className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-masonic-navy">
              <Link href="/contact">
                Schedule a Demo
                <Calendar className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-white">
            <div>
              <p className="text-3xl font-bold text-masonic-gold">500+</p>
              <p className="text-sm">Events Managed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-masonic-gold">50,000+</p>
              <p className="text-sm">Registrations Processed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-masonic-gold">98%</p>
              <p className="text-sm">Customer Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MasonicLogo size="sm" />
                <span className="text-lg font-semibold text-white">LodgeTix</span>
              </div>
              <p className="text-sm">
                Masonic Event Management Software
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/software/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/software/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/software/solutions" className="hover:text-white">Solutions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} LodgeTix. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}