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

// Square billing details for Web Payments SDK
export interface SquareBillingDetails {
  givenName?: string;
  familyName?: string;
  email?: string;
  phone?: string;
  addressLines?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string; // Square expects 2-letter ISO code
}

export interface CheckoutFormProps {
  totalAmount: number;
  onPaymentSuccess: (token: string, billingDetails: SquareBillingDetails) => void;
  onPaymentError: (errorMessage: string) => void;
  setIsProcessingPayment: (isProcessing: boolean) => void;
  billingDetails: BillingDetails;
  isProcessing?: boolean;
  payments: any; // Square Web Payments SDK instance
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