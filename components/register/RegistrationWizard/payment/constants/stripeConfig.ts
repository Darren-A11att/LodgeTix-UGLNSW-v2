// Stripe configuration constants
export const STRIPE_TEST_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""

export const STRIPE_APPEARANCE = {
  theme: 'stripe' as const
}

export const STRIPE_OPTIONS = {
  loader: 'auto' as const,
  allowedPresentationMethods: []
}