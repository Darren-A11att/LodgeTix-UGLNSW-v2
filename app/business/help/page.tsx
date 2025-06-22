import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LifebuoyIcon, NewspaperIcon, PhoneIcon } from '@heroicons/react/20/solid'

const supportCards = [
  {
    name: 'Registration Help',
    description: 'Step-by-step guidance for registering for Masonic events and functions.',
    icon: LifebuoyIcon,
  },
  {
    name: 'Account Support',
    description: 'Help with account management, login issues, and profile updates.',
    icon: PhoneIcon,
  },
  {
    name: 'Event Information',
    description: 'Details about upcoming events, venues, dress codes, and requirements.',
    icon: NewspaperIcon,
  },
]

const faqs = [
  {
    id: 1,
    question: "How do I register for an event?",
    answer:
      "Browse our events page and click 'Register' on any event you're interested in. Follow the registration wizard to select your tickets, provide attendee details, and complete payment through our secure system.",
  },
  {
    id: 2,
    question: "Can I register multiple attendees?",
    answer:
      "Yes, you can register as an individual, delegation, or lodge with multiple attendees. During registration, you can add additional attendees and specify their details including dietary requirements and lodge affiliations.",
  },
  {
    id: 3,
    question: "What payment methods are accepted?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor Stripe. All transactions are encrypted and processed securely.",
  },
  {
    id: 4,
    question: "Can I get a refund if I can't attend?",
    answer:
      "Yes, our refund policy allows for cancellations with varying refund amounts based on timing. Cancellations 30+ days before receive a full refund minus processing fees, while cancellations within 7 days may not be eligible for refunds.",
  },
  {
    id: 5,
    question: "Do I need to be a Freemason to attend events?",
    answer:
      "Most events are open to Freemasons and their partners/families. Some events may be restricted to members only. Event descriptions will specify any attendance requirements or restrictions.",
  },
  {
    id: 6,
    question: "How do I know if my registration was successful?",
    answer:
      "You'll receive an email confirmation immediately after successful payment. This email contains your booking reference, event details, and ticket information. Check your spam folder if you don't see it within a few minutes.",
  },
  {
    id: 7,
    question: "Can I modify my registration after booking?",
    answer:
      "Limited modifications may be possible depending on the event and timing. Contact our support team with your booking reference to discuss available options for changes to your registration.",
  },
  {
    id: 8,
    question: "What should I do if I have dietary requirements?",
    answer:
      "You can specify dietary requirements during the registration process. Common requirements like vegetarian, vegan, gluten-free, and allergies can be accommodated with advance notice.",
  }
]

export default function HelpPage() {
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
            <h2 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl">Help Center</h2>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
              Find answers to common questions about LodgeTix, event registration, payments, and more. 
              Our comprehensive help resources are here to guide you through every step.
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

      {/* FAQ Section */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
          <h2 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">Frequently asked questions</h2>
          <dl className="mt-20 divide-y divide-gray-900/10">
            {faqs.map((faq) => (
              <div key={faq.id} className="py-8 first:pt-0 last:pb-0 lg:grid lg:grid-cols-12 lg:gap-8">
                <dt className="text-base/7 font-semibold text-gray-900 lg:col-span-5">{faq.question}</dt>
                <dd className="mt-4 lg:col-span-7 lg:mt-0">
                  <p className="text-base/7 text-gray-600">{faq.answer}</p>
                </dd>
              </div>
            ))}
          </dl>
          
          {/* Contact CTA */}
          <div className="mt-20 text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Still need help?</h3>
            <p className="text-lg text-gray-600 mb-8">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <Button asChild size="lg">
              <Link href="/contact">
                Contact Support
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}