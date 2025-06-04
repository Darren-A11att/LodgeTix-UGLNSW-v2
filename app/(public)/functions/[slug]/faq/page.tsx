import { notFound } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { resolveFunctionSlug } from "@/lib/utils/function-slug-resolver"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

// FAQ categories and questions
const faqCategories = [
  {
    category: "Registration & Tickets",
    questions: [
      {
        question: "How do I register for the event?",
        answer: "You can register online by clicking the 'Register Now' button on the event page. Follow the step-by-step process to select your tickets and complete your registration."
      },
      {
        question: "Can I register multiple attendees at once?",
        answer: "Yes, you can register multiple attendees in a single transaction. Choose between Individual, Lodge, or Delegation registration types based on your needs."
      },
      {
        question: "What payment methods are accepted?",
        answer: "We accept all major credit and debit cards through our secure payment processor. Payment is required at the time of registration."
      },
      {
        question: "Can I modify my registration after booking?",
        answer: "Yes, you can modify your registration up to 7 days before the event. Contact the event organisers for assistance with changes."
      },
      {
        question: "How will I receive my tickets?",
        answer: "After successful registration, you'll receive an email confirmation with your e-tickets attached as PDFs. You can also access your tickets from your account dashboard."
      }
    ]
  },
  {
    category: "Event Details",
    questions: [
      {
        question: "What is the dress code?",
        answer: "The dress code varies by event. Please check the specific event details or your confirmation email for dress code requirements."
      },
      {
        question: "Are partners/guests welcome?",
        answer: "Yes, partners and guests are welcome at most events. You can add partner tickets during the registration process."
      },
      {
        question: "Is parking available at the venue?",
        answer: "Parking availability varies by venue. Please check the venue information page for specific parking details and costs."
      },
      {
        question: "Are meals included?",
        answer: "Meal inclusions depend on your ticket type. Full details of what's included with each ticket type are shown during the registration process."
      },
      {
        question: "What time should I arrive?",
        answer: "We recommend arriving at least 30 minutes before the event start time to allow for check-in and seating."
      }
    ]
  },
  {
    category: "Cancellations & Refunds",
    questions: [
      {
        question: "What is the cancellation policy?",
        answer: "Cancellations made more than 14 days before the event are eligible for a full refund minus a processing fee. Cancellations within 14 days may receive a partial refund."
      },
      {
        question: "How do I cancel my registration?",
        answer: "To cancel your registration, please contact the event organisers directly with your booking reference number."
      },
      {
        question: "Can I transfer my ticket to someone else?",
        answer: "Yes, tickets can be transferred to another person up to 48 hours before the event. Contact the organisers to arrange a transfer."
      },
      {
        question: "What happens if the event is cancelled?",
        answer: "If the event is cancelled by the organisers, all attendees will receive a full refund. We will contact you using the email address provided during registration."
      }
    ]
  },
  {
    category: "Accessibility & Special Requirements",
    questions: [
      {
        question: "Is the venue wheelchair accessible?",
        answer: "Most venues are wheelchair accessible. Please check the specific venue information or contact us if you have specific accessibility requirements."
      },
      {
        question: "Can dietary requirements be accommodated?",
        answer: "Yes, we can accommodate most dietary requirements. Please specify your requirements during registration or contact the organisers."
      },
      {
        question: "Is assistance available for elderly attendees?",
        answer: "Yes, we can arrange assistance for elderly attendees. Please contact us in advance to discuss your specific needs."
      }
    ]
  }
]

export default async function FAQPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  // Resolve slug to function ID (for consistency)
  const functionId = await resolveFunctionSlug(slug, true)
  
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Have a Question?</CardTitle>
          <CardDescription>
            Find answers to common questions below. If you can't find what you're looking for, 
            please don't hesitate to contact the event organisers.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="space-y-8">
        {faqCategories.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <h2 className="text-2xl font-semibold mb-4">{category.category}</h2>
            <Accordion type="single" collapsible className="space-y-4">
              {category.questions.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`${categoryIndex}-${index}`}
                  className="border rounded-lg px-6"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
      
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Still Have Questions?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            If you couldn't find the answer to your question, please contact us:
          </p>
          <ul className="space-y-2 text-gray-600">
            <li>• Email: events@uglnsw.org.au</li>
            <li>• Phone: (02) 9284 2800</li>
            <li>• Office Hours: Monday to Friday, 9:00 AM - 5:00 PM</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}