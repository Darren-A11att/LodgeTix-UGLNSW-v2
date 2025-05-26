// Shared types for payment components
import { BillingDetails, CountryType as ZodCountryType, StateTerritoryType } from "@/lib/billing-details-schema";

// Country and State types from react-country-state-city library
export interface Country {
  id: number;
  name: string;
  iso2: string; // Maps to ZodCountryType.isoCode
}

export interface State {
  id: number;
  name: string;
  iso2?: string;
  state_code?: string; // Short code like NSW, ACT
}

// Local type for Stripe billing details to avoid namespace conflict on client
export interface StripeBillingDetailsForClient {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string; // Stripe expects 2-letter ISO code
  };
}

export interface CheckoutFormProps {
  totalAmount: number;
  onPaymentSuccess: (paymentMethodId: string, billingDetailsForStripe: StripeBillingDetailsForClient) => void;
  onPaymentError: (errorMessage: string) => void;
  setIsProcessingPayment: (isProcessing: boolean) => void;
  billingDetails: BillingDetails;
}

export interface FilterableComboboxProps<T> {
  label: string;
  items: T[];
  placeholder?: string;
  id?: string;
  name?: string;
  value: T | null;
  onChange: (value: T | null) => void;
  displayValue: (item: T | null) => string;
  itemKey: (item: T) => string | number;
  filterFunction?: (item: T, query: string) => boolean;
  loading?: boolean;
  disabled?: boolean;
}