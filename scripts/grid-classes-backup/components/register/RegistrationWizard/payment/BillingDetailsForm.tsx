"use client"

import { useState, useEffect, useRef } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { GetCountries, GetState } from 'react-country-state-city';
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { BillingDetails, CountryType as ZodCountryType, StateTerritoryType } from "@/lib/billing-details-schema";
import { FilterableCombobox } from "./FilterableCombobox";
import { Country, State } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BillingDetailsFormProps {
  form: UseFormReturn<BillingDetails>;
  primaryAttendee?: {
    firstName?: string;
    lastName?: string;
    mobile?: string;
    email?: string;
  } | null;
  setBillingFormDetailsInStore?: (details: BillingDetails) => void;
}

export const BillingDetailsForm: React.FC<BillingDetailsFormProps> = ({
  form,
  primaryAttendee,
  setBillingFormDetailsInStore
}) => {
  if (!form) {
    // Log error in development, but use a clean error message in production
    return (
      <Card className="border-destructive shadow-md">
        <CardHeader className="bg-destructive text-destructive-foreground">
          <CardTitle>Billing Details Error</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p>There was an issue loading the billing details form. The 'form' object was not provided.</p>
        </CardContent>
      </Card>
    );
  }

  // States for data handling
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [fetchError, setFetchError] = useState<{countries?: string, states?: string} | null>(null);
  
  // Placeholder for IP Geolocation data - replace with your actual store access
  // const { ipCountryIsoCode, ipStateName } = useIpGeoStore(state => ({
  //   ipCountryIsoCode: state.ipCountryIsoCode, // e.g., "AU"
  //   ipStateName: state.ipStateName,          // e.g., "New South Wales"
  // }));
  const ipCountryIsoCode = null; // Replace with actual data
  const ipStateName = null;    // Replace with actual data

  const [hasAttemptedGeoCountryPreselection, setHasAttemptedGeoCountryPreselection] = useState(false);
  const [hasAttemptedGeoStatePreselection, setHasAttemptedGeoStatePreselection] = useState(false);

  // Form watchers
  const billToPrimaryWatched = form.watch('billToPrimary');
  const selectedCountry = form.watch('country');
  const selectedState = form.watch('stateTerritory'); // Watch state for geo preselection logic

  // Convert data to expected format
  const zodCountries: ZodCountryType[] = countries.map(c => ({ 
    name: c.name, 
    isoCode: c.iso2,
    id: c.id
  }));

  // Handle "Bill to Primary" checkbox changes
  useEffect(() => {
    const currentFormValues = form.getValues();
    let detailsToSet: BillingDetails;

    if (billToPrimaryWatched && primaryAttendee) {
      // When checkbox is checked and we have primary attendee data
      detailsToSet = {
        ...currentFormValues, // Preserve existing address fields
        billToPrimary: true,
        firstName: primaryAttendee.firstName || '',
        lastName: primaryAttendee.lastName || '',
        mobileNumber: primaryAttendee.mobile || '',
        emailAddress: primaryAttendee.email || '',
        // Address fields are preserved from currentFormValues
      };
    } else if (!billToPrimaryWatched) {
      // When checkbox is unchecked - clear personal data but preserve any existing address info
      detailsToSet = {
        ...currentFormValues, // Preserve any address fields user may have entered
        billToPrimary: false,
        firstName: currentFormValues.firstName || '', // Preserve these instead of clearing
        lastName: currentFormValues.lastName || '',
        mobileNumber: currentFormValues.mobileNumber || '',
        emailAddress: currentFormValues.emailAddress || '',
        // The rest of the fields are preserved from currentFormValues
      };
    } else {
      // This branch handles the case where (billToPrimaryWatched is true AND primaryAttendee is null/undefined)
      detailsToSet = {
        ...currentFormValues, // Preserve fields from current form values
        billToPrimary: true,   // Keep this true as per checkbox state
        firstName: '',
        lastName: '',
        mobileNumber: '',
        emailAddress: '',
        // Keep any address fields that may have been entered
      };
    }

    form.reset(detailsToSet); // Reset local RHF state
    if (setBillingFormDetailsInStore) {
      setBillingFormDetailsInStore(detailsToSet); // Update Zustand store
    }
  }, [billToPrimaryWatched, primaryAttendee, form, setBillingFormDetailsInStore]);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const result = await GetCountries();
        setCountries(result.sort((a, b) => a.name.localeCompare(b.name)));
        setFetchError(prev => ({...prev, countries: undefined}));
      } catch (err) {
        // Handle error silently without console logs
        setFetchError(prev => ({...prev, countries: 'Failed to load countries.'}));
      } finally {
        setIsLoadingCountries(false);
      }
    };
    
    fetchCountries();
  }, []);

  // Pre-select country based on IP geolocation data
  useEffect(() => {
    if (countries.length > 0 && ipCountryIsoCode && !hasAttemptedGeoCountryPreselection && !form.getValues('country')) {
      const geoCountry = countries.find(c => c.iso2 === ipCountryIsoCode);
      if (geoCountry) {
        const countryToSet: ZodCountryType = { name: geoCountry.name, isoCode: geoCountry.iso2, id: geoCountry.id };
        form.setValue('country', countryToSet, { shouldValidate: true });
      }
      setHasAttemptedGeoCountryPreselection(true);
    }
  }, [countries, ipCountryIsoCode, hasAttemptedGeoCountryPreselection, form]);

  // Fetch states when selected country changes
  useEffect(() => {
    const fetchStates = async () => {
      if (!selectedCountry?.id) {
        setStates([]);
        return;
      }
      
      setIsLoadingStates(true);
      try {
        const result = await GetState(selectedCountry.id);
        setStates(result.sort((a, b) => a.name.localeCompare(b.name)));
        setFetchError(prev => ({...prev, states: undefined}));
      } catch (err) {
        // Handle error silently without console logs
        setFetchError(prev => ({...prev, states: 'Failed to load states for the selected country.'}));
        setStates([]);
      } finally {
        setIsLoadingStates(false);
      }
    };
    
    fetchStates();
  }, [selectedCountry?.id]);
  
  // Pre-select state based on IP geolocation data, after country is set and states are loaded
  useEffect(() => {
    if (states.length > 0 && 
        selectedCountry?.isoCode === ipCountryIsoCode && 
        typeof ipStateName === 'string' && // More robust type guard
        ipStateName && 
        !hasAttemptedGeoStatePreselection && 
        !form.getValues('stateTerritory')) {
      const geoState = states.find(s => s.name.toLowerCase() === ipStateName.toLowerCase()); // Now ipStateName is confirmed string
      if (geoState) {
        const stateToSet: StateTerritoryType = { 
          id: geoState.id, 
          name: geoState.name, 
          isoCode: geoState.state_code, 
          countryCode: selectedCountry.isoCode 
        };
        form.setValue('stateTerritory', stateToSet, { shouldValidate: true });
      }
      setHasAttemptedGeoStatePreselection(true);
    }
    if (selectedCountry?.isoCode !== ipCountryIsoCode) {
      setHasAttemptedGeoStatePreselection(false);
    }
  }, [states, selectedCountry, ipCountryIsoCode, ipStateName, hasAttemptedGeoStatePreselection, form]);

  // Clear state selection when country changes
  useEffect(() => {
    // Only clear if the change wasn't from our geo-preselection of state
    if (form.getValues('stateTerritory')?.countryCode !== selectedCountry?.isoCode) {
      form.setValue('stateTerritory', undefined, { shouldValidate: true });
    }
  }, [selectedCountry, form]);

  return (
    <Card className="border-masonic-navy shadow-md">
      <CardHeader className="bg-masonic-navy text-white">
        <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5" /> Billing Details</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Row 1: Bill To Primary & Names */}
        <div>
          <FormField
            control={form.control}
            name="billToPrimary"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 mb-4">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="font-normal">
                  Bill to {primaryAttendee ? `${primaryAttendee.firstName} ${primaryAttendee.lastName} (Primary Attendee)` : 'Primary Attendee'}
                </FormLabel>
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField 
              control={form.control} 
              name="firstName" 
              render={({ field }) => { 
                const inputRef = useRef<HTMLInputElement>(null);
                
                const handleBlur = () => {
                  if (inputRef.current && inputRef.current.value !== field.value) {
                    field.onChange(inputRef.current.value);
                  }
                  field.onBlur();
                };
                
                return (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input 
                        ref={inputRef} 
                        name={field.name}
                        defaultValue={field.value} 
                        onBlur={handleBlur} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem> 
                );
              }} 
            />
            <FormField 
              control={form.control} 
              name="lastName" 
              render={({ field }) => {
                const inputRef = useRef<HTMLInputElement>(null);
                
                const handleBlur = () => {
                  if (inputRef.current && inputRef.current.value !== field.value) {
                    field.onChange(inputRef.current.value);
                  }
                  field.onBlur();
                };
                
                return (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input 
                        ref={inputRef} 
                        name={field.name}
                        defaultValue={field.value} 
                        onBlur={handleBlur} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem> 
                );
              }} 
            />
          </div>
        </div>
        <Separator className="my-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr] gap-x-8 relative">
          <div className="hidden md:block absolute inset-y-0 left-1/2 w-px bg-gray-300 transform -translate-x-1/2"></div>

          {/* Left Column - REORDERED and Business Number ADDED */}
          <div className="space-y-4 md:pr-4">
            {/* 1. Mobile Number */}
            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => {
                const phoneRef = useRef<string>(field.value || '');
                const handlePhoneChange = (value: string) => {
                  if (value !== phoneRef.current) {
                    phoneRef.current = value;
                    field.onChange(value);
                  }
                };
                return (
                  <FormItem>
                    <FormLabel>Mobile Number *</FormLabel>
                    <FormControl>
                      <PhoneInput 
                        name="mobileNumber" 
                        value={field.value} 
                        onChange={handlePhoneChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* 2. Email Address */}
            <FormField 
              control={form.control} 
              name="emailAddress" 
              render={({ field }) => {
                const inputRef = useRef<HTMLInputElement>(null);
                const handleBlur = () => {
                  if (inputRef.current && inputRef.current.value !== field.value) {
                    field.onChange(inputRef.current.value);
                  }
                  field.onBlur();
                };
                return (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input 
                        ref={inputRef} 
                        name={field.name}
                        type="email"
                        defaultValue={field.value} 
                        onBlur={handleBlur} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem> 
                );
              }}
            />

            {/* 3. Business Name */}
            <FormField 
              control={form.control} 
              name="businessName" 
              render={({ field }) => {
                const inputRef = useRef<HTMLInputElement>(null);
                const handleBlur = () => {
                  if (inputRef.current && inputRef.current.value !== field.value) {
                    field.onChange(inputRef.current.value);
                  }
                  field.onBlur();
                };
                return (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input 
                        ref={inputRef} 
                        name={field.name}
                        defaultValue={field.value} 
                        onBlur={handleBlur} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem> 
                );
              }}
            />

            {/* 4. Business Number (NEW FIELD) */}
            <FormField 
              control={form.control} 
              name="businessNumber" 
              render={({ field }) => {
                const inputRef = useRef<HTMLInputElement>(null);
                const handleBlur = () => {
                  if (inputRef.current && inputRef.current.value !== field.value) {
                    field.onChange(inputRef.current.value);
                  }
                  field.onBlur();
                };
                return (
                  <FormItem>
                    <FormLabel>Business Number</FormLabel> {/* Optional, so no asterisk */}
                    <FormControl>
                      <Input 
                        ref={inputRef} 
                        name={field.name}
                        defaultValue={field.value} 
                        onBlur={handleBlur} 
                        placeholder="E.g., ABN, ACN" // Added placeholder
                      />
                    </FormControl>
                    <FormMessage /> {/* For potential validation messages if you add them later */}
                  </FormItem> 
                );
              }} 
            />
          </div>

          {/* Right Column (Country, Address Line 1, Suburb, Postcode/State) - Layout as previously modified */}
          <div className="space-y-4 md:pl-4">
            {/* 1. Country */}
            <Controller
              control={form.control}
              name="country"
              render={({ field, fieldState: { error } }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <FilterableCombobox 
                    label="Country"
                    items={zodCountries} 
                    placeholder={isLoadingCountries ? "Loading countries..." : "Search for a country..."}
                    id="country-select"
                    name={field.name}
                    value={field.value || null}
                    onChange={(selectedZodCountry: ZodCountryType | null) => {
                      field.onChange(selectedZodCountry);
                    }}
                    displayValue={(zodCountry: ZodCountryType | null) => zodCountry?.name || ''}
                    itemKey={(zodCountry: ZodCountryType) => zodCountry.id! || zodCountry.isoCode}
                    loading={isLoadingCountries}
                  />
                  {fetchError?.countries && <div className="text-sm text-red-500 mt-1">{fetchError.countries}</div>}
                  {error && <FormMessage>{error.message}</FormMessage>} 
                </FormItem>
              )}
            />

            {/* 2. Street Address (addressLine1) */}
            <FormField 
              control={form.control} 
              name="addressLine1" 
              render={({ field }) => {
                const inputRef = useRef<HTMLInputElement>(null);
                
                const handleBlur = () => {
                  if (inputRef.current && inputRef.current.value !== field.value) {
                    field.onChange(inputRef.current.value);
                  }
                  field.onBlur();
                };
                
                return (
                  <FormItem>
                    <FormLabel>Address Line 1 *</FormLabel>
                    <FormControl>
                      <Input 
                        ref={inputRef} 
                        name={field.name}
                        defaultValue={field.value} 
                        onBlur={handleBlur} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem> 
                );
              }} 
            />

            {/* 3. Suburb */}
            <FormField 
              control={form.control} 
              name="suburb" 
              render={({ field }) => {
                const inputRef = useRef<HTMLInputElement>(null);
                
                const handleBlur = () => {
                  if (inputRef.current && inputRef.current.value !== field.value) {
                    field.onChange(inputRef.current.value);
                  }
                  field.onBlur();
                };
                
                return (
                  <FormItem>
                    <FormLabel>Suburb *</FormLabel>
                    <FormControl>
                      <Input 
                        ref={inputRef} 
                        name={field.name}
                        defaultValue={field.value} 
                        onBlur={handleBlur} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem> 
                );
              }} 
            />
            
            {/* 4. Postcode and State/Territory on the same line */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 4a. Postcode */}
              <FormField 
                control={form.control} 
                name="postcode" 
                render={({ field }) => {
                  const inputRef = useRef<HTMLInputElement>(null);
                  
                  const handleBlur = () => {
                    if (inputRef.current && inputRef.current.value !== field.value) {
                      field.onChange(inputRef.current.value);
                    }
                    field.onBlur();
                  };
                  
                  return (
                    <FormItem>
                      <FormLabel>Postcode *</FormLabel>
                      <FormControl>
                        <Input 
                          ref={inputRef} 
                          name={field.name}
                          defaultValue={field.value} 
                          onBlur={handleBlur} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem> 
                  );
                }}
              />

              {/* 4b. State/Territory (Controller using Select) */}
              <Controller
                control={form.control}
                name="stateTerritory"
                render={({ field, fieldState: { error } }) => (
                  <FormItem>
                    <FormLabel>State/Territory *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const selectedStateFromList = states.find(s => s.id.toString() === value);
                        if (selectedStateFromList) {
                          const stateObj: StateTerritoryType = {
                            id: selectedStateFromList.id,
                            name: selectedStateFromList.name,
                            isoCode: selectedStateFromList.state_code,
                            countryCode: selectedCountry?.isoCode
                          };
                          field.onChange(stateObj);
                        } else {
                          field.onChange(undefined);
                        }
                      }}
                      value={field.value?.id?.toString() || ""}
                      disabled={isLoadingStates || !selectedCountry || states.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue 
                            placeholder={
                              isLoadingStates 
                                ? "Loading states..." 
                                : !selectedCountry
                                  ? "Select a country first"
                                  : states.length === 0
                                    ? "No states available"
                                    : "Select a state/territory"
                            } 
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {states.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.state_code || s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fetchError?.states && <div className="text-sm text-red-500 mt-1">{fetchError.states}</div>}
                    {error && <FormMessage>{error.message}</FormMessage>}
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};