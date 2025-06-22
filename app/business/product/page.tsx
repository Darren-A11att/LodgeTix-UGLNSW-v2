import Link from "next/link"
import { 
  Calendar,
  CheckCircle2,
  Users,
  ClipboardCheck,
  Mail,
  BarChart3,
  CreditCard,
  Shield,
  FileText,
  Share2,
  UserCheck,
  Building2,
  Megaphone,
  Globe,
  Printer,
  Lock,
  Cloud,
  Zap,
  ChevronRight,
  CheckIcon,
  X,
  Building,
  DollarSign
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Feature categories with their features
const featureCategories = [
  {
    id: "event-planning",
    name: "Event Planning & Management",
    description: "Comprehensive tools to plan and execute Masonic events",
    icon: Calendar,
    features: [
      {
        name: "Event Creation Wizard",
        description: "Step-by-step event setup with Masonic-specific templates",
        benefit: "Launch events in minutes, not hours",
        useCase: "Create Grand Proclamations, Installation ceremonies, or Lodge meetings with pre-configured settings"
      },
      {
        name: "Multi-Session Support",
        description: "Manage complex events with multiple sessions or degrees",
        benefit: "Handle complex ceremonial structures effortlessly",
        useCase: "Run multi-degree ceremonies or events spanning multiple days with individual session tracking"
      },
      {
        name: "Venue Management",
        description: "Integrated venue details with maps and accessibility info",
        benefit: "Help attendees navigate to your Lodge easily",
        useCase: "Provide clear directions to country Lodges or multiple venue locations for large events"
      },
      {
        name: "Event Templates",
        description: "Save and reuse event configurations",
        benefit: "Standardize recurring events across your jurisdiction",
        useCase: "Create templates for monthly meetings, annual installations, or degree work"
      }
    ]
  },
  {
    id: "registration",
    name: "Registration & Check-in",
    description: "Streamlined attendee registration and event day operations",
    icon: ClipboardCheck,
    features: [
      {
        name: "Smart Registration Forms",
        description: "Masonic-aware forms with rank, Lodge, and dietary preferences",
        benefit: "Capture all necessary information without complexity",
        useCase: "Automatically collect Grand Lodge affiliations, officer ranks, and special requirements"
      },
      {
        name: "QR Code Check-in",
        description: "Contactless check-in with mobile or printed QR codes",
        benefit: "Reduce queues and speed up event entry",
        useCase: "Check in 500+ Brethren at Grand Proclamations in minutes with multiple entry points"
      },
      {
        name: "Guest Management",
        description: "Handle partners and non-Masonic guests appropriately",
        benefit: "Maintain proper protocols while being inclusive",
        useCase: "Manage Ladies' Nights, open installations, or public charity events"
      },
      {
        name: "Waitlist Management",
        description: "Automatic waitlist handling with notifications",
        benefit: "Never leave seats empty when demand is high",
        useCase: "Automatically offer cancelled spots to waitlisted Brethren for popular events"
      }
    ]
  },
  {
    id: "attendee-management",
    name: "Attendee Management & Communication",
    description: "Build relationships and keep everyone informed",
    icon: Users,
    features: [
      {
        name: "Attendee Database",
        description: "Comprehensive records of all event participants",
        benefit: "Build lasting relationships with your members",
        useCase: "Track attendance patterns and identify members needing engagement"
      },
      {
        name: "Automated Communications",
        description: "Event reminders, updates, and follow-ups",
        benefit: "Keep attendees informed without manual effort",
        useCase: "Send automatic reminders for festive board numbers or event changes"
      },
      {
        name: "Seating Management",
        description: "Assign seating with Masonic protocols in mind",
        benefit: "Ensure proper placement for ranks and visitors",
        useCase: "Automatically arrange seating by rank for formal dinners or ceremonies"
      },
      {
        name: "Group Registrations",
        description: "Lodge Secretaries can register multiple members",
        benefit: "Simplify coordination for Lodge attendance",
        useCase: "Allow Lodge Secretaries to book entire Lodge delegations for official visits"
      }
    ]
  },
  {
    id: "marketing",
    name: "Event Marketing & Distribution",
    description: "Reach your target audience effectively",
    icon: Megaphone,
    features: [
      {
        name: "LodgeTix Events Page",
        description: "Your events automatically listed on the central LodgeTix events page",
        benefit: "Instant visibility to all members browsing upcoming Masonic events",
        useCase: "Events are distributed through our centralized discovery platform reaching thousands of Brethren"
      },
      {
        name: "Event Marketplace Listing",
        description: "Professional listing in the LodgeTix event marketplace",
        benefit: "Members discover and register for your events alongside other Lodge activities",
        useCase: "Market special degree work or charity events through our established event infrastructure"
      },
      {
        name: "Custom Event Pages",
        description: "Dedicated event pages with Lodge branding on the LodgeTix platform",
        benefit: "Professional presentation within our trusted event ecosystem",
        useCase: "Create stunning pages for installations that members find through the LodgeTix events hub"
      },
      {
        name: "Integrated Promotion",
        description: "Built-in promotion tools including social sharing and email campaigns",
        benefit: "Amplify your reach beyond the LodgeTix events page",
        useCase: "Share your LodgeTix event listing across social media and email channels"
      }
    ]
  },
  {
    id: "sponsorship",
    name: "Sponsorship Management",
    description: "Secure and manage event sponsorships professionally",
    icon: Building2,
    features: [
      {
        name: "Sponsor Packages",
        description: "Create tiered sponsorship opportunities",
        benefit: "Maximize event funding opportunities",
        useCase: "Offer Gold, Silver, Bronze packages for charity dinners or galas"
      },
      {
        name: "Sponsor Recognition",
        description: "Automated sponsor logos on tickets and communications",
        benefit: "Deliver value to sponsors automatically",
        useCase: "Display sponsor branding on e-tickets and event pages"
      },
      {
        name: "Sponsor Portal",
        description: "Self-service portal for sponsors to manage their benefits",
        benefit: "Reduce administrative overhead",
        useCase: "Let sponsors upload logos and manage their booth preferences"
      },
      {
        name: "ROI Reporting",
        description: "Show sponsors the value of their investment",
        benefit: "Build long-term sponsor relationships",
        useCase: "Provide attendance metrics and engagement data to sponsors"
      }
    ]
  },
  {
    id: "printed-materials",
    name: "Printed Materials & Collateral",
    description: "Professional materials for your events",
    icon: Printer,
    features: [
      {
        name: "Name Badge Printing",
        description: "Auto-generated badges with ranks and Lodge details",
        benefit: "Professional badges without manual creation",
        useCase: "Print color-coded badges for Grand Lodge events with proper titles"
      },
      {
        name: "Attendance Lists",
        description: "Formatted lists for Tyler and registration desk",
        benefit: "Maintain proper records and security",
        useCase: "Generate Tyler's lists with member verification details"
      },
      {
        name: "Event Programs",
        description: "Merge attendee data into program templates",
        benefit: "Accurate programs without manual data entry",
        useCase: "Auto-populate officer names in installation ceremony programs"
      },
      {
        name: "Certificates",
        description: "Generate attendance or participation certificates",
        benefit: "Provide meaningful keepsakes",
        useCase: "Create commemorative certificates for special degree ceremonies"
      }
    ]
  },
  {
    id: "reporting",
    name: "Reporting & Insights",
    description: "Data-driven decisions for better events",
    icon: BarChart3,
    features: [
      {
        name: "Real-time Dashboard",
        description: "Live event metrics and registration tracking",
        benefit: "Make informed decisions quickly",
        useCase: "Monitor registration pace and adjust marketing efforts accordingly"
      },
      {
        name: "Financial Reports",
        description: "Detailed revenue and expense tracking",
        benefit: "Maintain transparency and accountability",
        useCase: "Generate treasurer reports for Lodge meetings or Grand Lodge returns"
      },
      {
        name: "Attendance Analytics",
        description: "Track patterns and trends over time",
        benefit: "Identify opportunities for growth",
        useCase: "Analyze which event types attract the most Brethren"
      },
      {
        name: "Custom Reports",
        description: "Build reports specific to your needs",
        benefit: "Get exactly the data you need",
        useCase: "Create Grand Secretary returns or Lodge-specific metrics"
      }
    ]
  },
  {
    id: "payment",
    name: "Payment Collection",
    description: "Simple, secure payment processing",
    icon: CreditCard,
    features: [
      {
        name: "Integrated Payments",
        description: "Accept cards and digital payments seamlessly",
        benefit: "Reduce cash handling and improve convenience",
        useCase: "Collect festive board payments or charity donations online"
      },
      {
        name: "Payment Plans",
        description: "Offer installment options for larger events",
        benefit: "Make expensive events more accessible",
        useCase: "Allow payment plans for Grand Lodge festival dinners"
      },
      {
        name: "Refund Management",
        description: "Process refunds with full audit trail",
        benefit: "Handle cancellations professionally",
        useCase: "Manage refunds for cancelled events with proper documentation"
      }
    ]
  },
  {
    id: "vendor-supplier",
    name: "Vendor & Supplier Management",
    description: "Manage catering companies, venue suppliers, and service providers",
    icon: Building,
    features: [
      {
        name: "Supplier Database",
        description: "Centralized database of approved caterers, suppliers, and service providers",
        benefit: "Quick access to trusted vendors for consistent quality",
        useCase: "Maintain list of preferred caterers with dietary capability information"
      },
      {
        name: "Automated Dietary Requirements",
        description: "Automatically transmit attendee dietary requirements to caterers",
        benefit: "Eliminate manual communication and reduce errors",
        useCase: "Send complete dietary lists to caterers 48 hours before events automatically"
      },
      {
        name: "Quote Management",
        description: "Request and compare quotes from multiple suppliers",
        benefit: "Ensure competitive pricing and service options",
        useCase: "Get catering quotes for different meal options and guest numbers"
      },
      {
        name: "Vendor Performance Tracking",
        description: "Track supplier performance and member feedback",
        benefit: "Make informed decisions for future events",
        useCase: "Rate caterers on food quality, service, and timeliness for future reference"
      }
    ]
  },
  {
    id: "expense-finance",
    name: "Expense & Finance Tracking",
    description: "Lightweight accounting module for event budgeting and financial reporting",
    icon: DollarSign,
    features: [
      {
        name: "Event Budget Planning",
        description: "Create detailed budgets with categories and cost forecasting",
        benefit: "Plan financially successful events within Lodge means",
        useCase: "Budget for installation dinners including venue, catering, and entertainment costs"
      },
      {
        name: "Expense Tracking",
        description: "Record and categorize all event-related expenses",
        benefit: "Maintain accurate financial records for Lodge accounts",
        useCase: "Track all costs from deposits to final payments with receipt attachments"
      },
      {
        name: "Financial Reporting",
        description: "Generate treasurer reports and financial summaries",
        benefit: "Provide transparency and accountability to Lodge members",
        useCase: "Create detailed financial reports for Lodge meetings and annual returns"
      },
      {
        name: "Revenue Analysis",
        description: "Track registration income against expenses for profitability",
        benefit: "Understand which events are financially successful",
        useCase: "Analyze ticket sales performance and adjust pricing for future events"
      }
    ]
  }
]

// Integration capabilities
const integrations = [
  {
    name: "Email Providers",
    description: "Sync with your existing email marketing tools",
    examples: ["Mailchimp", "SendGrid", "Custom SMTP"]
  },
  {
    name: "Calendar Systems",
    description: "Export events to popular calendar applications",
    examples: ["Google Calendar", "Outlook", "Apple Calendar"]
  },
  {
    name: "Payment Gateways",
    description: "Secure payment processing with trusted providers",
    examples: ["Square", "Stripe", "PayPal"]
  },
  {
    name: "Communication Tools",
    description: "Keep members informed through their preferred channels",
    examples: ["SMS/Text", "WhatsApp", "Telegram"]
  }
]

// Security features
const securityFeatures = [
  {
    icon: Shield,
    name: "Data Encryption",
    description: "Bank-level encryption for all sensitive data"
  },
  {
    icon: Lock,
    name: "Access Control",
    description: "Role-based permissions for Lodge officers"
  },
  {
    icon: Cloud,
    name: "Secure Hosting",
    description: "Enterprise-grade cloud infrastructure"
  },
  {
    icon: FileText,
    name: "Audit Trails",
    description: "Complete history of all system changes"
  }
]

// Comparison tiers for features
const comparisonPlans = [
  {
    name: "Basic",
    description: "For smaller Lodges",
    features: {
      "Event Creation": true,
      "Registration Management": true,
      "Basic Check-in": true,
      "Email Notifications": true,
      "Standard Reports": true,
      "Payment Processing": true,
      "Email Support": true,
      "Custom Branding": false,
      "Advanced Analytics": false,
      "API Access": false,
      "Priority Support": false,
      "Custom Integrations": false
    }
  },
  {
    name: "Professional",
    description: "For active Lodges",
    featured: true,
    features: {
      "Event Creation": true,
      "Registration Management": true,
      "Basic Check-in": true,
      "Email Notifications": true,
      "Standard Reports": true,
      "Payment Processing": true,
      "Email Support": true,
      "Custom Branding": true,
      "Advanced Analytics": true,
      "API Access": false,
      "Priority Support": true,
      "Custom Integrations": false
    }
  },
  {
    name: "Enterprise",
    description: "For Grand Lodges",
    features: {
      "Event Creation": true,
      "Registration Management": true,
      "Basic Check-in": true,
      "Email Notifications": true,
      "Standard Reports": true,
      "Payment Processing": true,
      "Email Support": true,
      "Custom Branding": true,
      "Advanced Analytics": true,
      "API Access": true,
      "Priority Support": true,
      "Custom Integrations": true
    }
  }
]

export default function ProductPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20 pt-14">
        <div className="absolute inset-y-0 right-1/2 -z-10 -mr-96 w-[200%] origin-top-right skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:-mr-80 lg:-mr-96" />
        <div className="mx-auto max-w-7xl px-6 py-32 sm:py-40 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-x-16 lg:gap-y-6 xl:grid-cols-1 xl:grid-rows-1 xl:gap-x-8">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-6xl lg:col-span-2 xl:col-auto">
              The Complete Event Management Platform for Masonic Organizations
            </h1>
            <div className="mt-6 max-w-xl lg:mt-0 xl:col-end-1 xl:row-start-1">
              <p className="text-lg/8 text-gray-600">
                Purpose-built for Freemasonry, LodgeTix provides everything you need to plan, promote, and manage 
                successful Masonic events. From intimate Lodge meetings to Grand Proclamations, we've got you covered.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Button asChild size="lg">
                  <Link href="/business/pricing">View Pricing</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/business/about/contact">Request Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Categories */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base/7 font-semibold text-indigo-600">Everything you need</h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Powerful features designed for Freemasonry
          </p>
          <p className="mt-6 text-lg/8 text-gray-600">
            Every feature is crafted with Masonic traditions and requirements in mind, 
            ensuring your events run smoothly while maintaining proper protocols.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-7xl">
          <Tabs defaultValue="event-planning" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:grid-cols-11 h-auto">
              {featureCategories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex flex-col gap-1 h-auto py-3 px-2 text-xs"
                >
                  <category.icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{category.name.split('&')[0].trim()}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {featureCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-8">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <category.icon className="h-8 w-8 text-indigo-600" />
                      <div>
                        <CardTitle className="text-2xl">{category.name}</CardTitle>
                        <CardDescription className="text-base mt-1">
                          {category.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      {category.features.map((feature) => (
                        <div key={feature.name} className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Benefit:</span> {feature.benefit}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <Zap className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Use Case:</span> {feature.useCase}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Feature Comparison Grid */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base/7 font-semibold text-indigo-600">Compare plans</h2>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
              Choose the right plan for your Lodge
            </p>
            <p className="mt-6 text-lg/8 text-gray-600">
              All plans include core features. Upgrade for advanced capabilities and premium support.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl lg:max-w-none">
            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8">
              {comparisonPlans.map((plan) => (
                <Card key={plan.name} className={plan.featured ? 'ring-2 ring-indigo-600' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      {plan.featured && (
                        <Badge className="bg-indigo-600">Most Popular</Badge>
                      )}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {Object.entries(plan.features).map(([feature, included]) => (
                        <li key={feature} className="flex items-start gap-3">
                          {included ? (
                            <CheckIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <X className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          )}
                          <span className={included ? 'text-gray-900' : 'text-gray-500'}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      asChild 
                      className="w-full" 
                      variant={plan.featured ? 'default' : 'outline'}
                    >
                      <Link href="/business/pricing">View Pricing</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Integration Capabilities */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base/7 font-semibold text-indigo-600">Integrations</h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Works with your existing tools
          </p>
          <p className="mt-6 text-lg/8 text-gray-600">
            LodgeTix integrates seamlessly with the tools you already use, 
            making adoption easy and enhancing your existing workflows.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          {integrations.map((integration) => (
            <Card key={integration.name}>
              <CardHeader>
                <CardTitle className="text-lg">{integration.name}</CardTitle>
                <CardDescription>{integration.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {integration.examples.map((example) => (
                    <Badge key={example} variant="secondary">
                      {example}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Security and Compliance */}
      <div className="bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base/7 font-semibold text-indigo-400">Security First</h2>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Your data is safe with us
            </p>
            <p className="mt-6 text-lg/8 text-gray-300">
              We understand the importance of discretion and security in Masonic affairs. 
              That's why we've built LodgeTix with security at its core.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4">
            {securityFeatures.map((feature) => (
              <div key={feature.name} className="flex flex-col items-center text-center">
                <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{feature.name}</h3>
                <p className="mt-2 text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <Button asChild size="lg" variant="outline" className="bg-white/10 text-white hover:bg-white/20 border-white/20">
              <Link href="/business/about/terms">Learn More About Legal & Security</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Ready to transform your event management?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg/8 text-indigo-100">
              Join hundreds of Lodges across NSW & ACT who trust LodgeTix for their event management needs.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
                <Link href="/register">
                  Get Started Free
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                <Link href="/business/about/contact">Schedule Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}