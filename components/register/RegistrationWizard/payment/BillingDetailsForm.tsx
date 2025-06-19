"use client"

import { useState, useEffect, useRef } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { GetCountries, GetState } from 'react-country-state-city';
import { User, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { BillingDetails, CountryType as ZodCountryType, StateTerritoryType } from "@/lib/booking-contact-schema";
import { FilterableCombobox } from "./FilterableCombobox";
import { Country, State } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegistrationStore } from "@/lib/registrationStore";
import { useCallback } from "react";
import { getAllGrandLodges, GrandLodgeRow } from "@/lib/api/grandLodges";

interface BillingDetailsFormProps {
  form: UseFormReturn<BillingDetails>;
  primaryAttendee?: {
    firstName?: string;
    lastName?: string;
    primaryPhone?: string;
    primaryEmail?: string;
    grand_lodge_id?: string | null;
    attendeeType?: string;
  } | null;
  setBillingFormDetailsInStore?: (details: BillingDetails) => void;
  footerContent?: React.ReactNode;
}

export const BillingDetailsForm: React.FC<BillingDetailsFormProps> = ({
  form,
  primaryAttendee,
  setBillingFormDetailsInStore,
  footerContent
}) => {
  if (!form) {
    // Log error in development, but use a clean error message in production
    return (
      <Card className="border-destructive shadow-md">
        <CardHeader className="bg-destructive text-destructive-foreground">
          <CardTitle>Booking Contact Error</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p>There was an issue loading the booking contact form. The 'form' object was not provided.</p>
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
  
  // Track previous billToPrimary value to detect actual changes
  const [prevBillToPrimary, setPrevBillToPrimary] = useState(false);
  
  // Removed geolocation data usage - users must manually select country
  
  // Get stored billing details from Zustand store
  const storeBillingDetails = useRegistrationStore(state => state.billingDetails);

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

  // Add direct access to the Zustand store for immediate updates
  const updateStoreBillingDetails = useRegistrationStore(state => state.updateBillingDetails);
  
  // Add a ref to track if we're updating from billToPrimary
  const isUpdatingFromBillToPrimary = useRef(false);
  
  // Add a field watcher to update store when form values change
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Skip updates if we're currently updating from billToPrimary checkbox
      if (isUpdatingFromBillToPrimary.current) {
        return;
      }
      
      // Only update store when values actually change (not on first render)
      if (type === 'change') {
        // Get all current form values
        const currentValues = form.getValues();
        
        // Update Zustand store with billing details - include ALL form fields
        const billingDataForStore = {
          title: currentValues.title || '',
          firstName: currentValues.firstName || '',
          lastName: currentValues.lastName || '',
          email: currentValues.emailAddress || '',
          phone: currentValues.mobileNumber || '',
          addressLine1: currentValues.addressLine1 || '',
          addressLine2: currentValues.addressLine2 || '',
          city: currentValues.suburb || '', 
          stateProvince: currentValues.stateTerritory?.name || '',
          postalCode: currentValues.postcode || '',
          country: currentValues.country?.isoCode || '',
          businessName: currentValues.businessName || '',
          businessNumber: currentValues.businessNumber || '',
        };
        
        // Update the store
        updateStoreBillingDetails(billingDataForStore);
        
        // Also call the prop callback if provided
        if (setBillingFormDetailsInStore) {
          setBillingFormDetailsInStore(currentValues);
        }
      }
    });
    
    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [form, updateStoreBillingDetails, setBillingFormDetailsInStore]);

  // Handle "Bill to Primary" checkbox changes with immediate store update
  useEffect(() => {
    // Only process if the checkbox state actually changed
    if (billToPrimaryWatched === prevBillToPrimary) {
      return;
    }
    
    const currentFormValues = form.getValues();
    let shouldUpdate = false;
    let detailsToSet: BillingDetails;

    if (billToPrimaryWatched && primaryAttendee && !prevBillToPrimary) {
      // Checkbox was just checked - populate with primary attendee data
      shouldUpdate = true;
      detailsToSet = {
        ...currentFormValues, // Preserve existing address fields
        billToPrimary: true,
        firstName: primaryAttendee.firstName || '',
        lastName: primaryAttendee.lastName || '',
        mobileNumber: primaryAttendee.primaryPhone || '',
        emailAddress: primaryAttendee.primaryEmail || '',
        // Address fields are preserved from currentFormValues
      };
      
      // Removed auto-populate country for Mason with Grand Lodge
      // Users must manually select their country
      
    } else if (!billToPrimaryWatched && prevBillToPrimary) {
      // Checkbox was just unchecked - clear the personal details
      shouldUpdate = true;
      detailsToSet = {
        ...currentFormValues, // Preserve address fields
        billToPrimary: false,
        // Clear personal details
        firstName: '',
        lastName: '',
        mobileNumber: '',
        emailAddress: '',
      };
    }
    
    // Update the previous state tracker
    setPrevBillToPrimary(billToPrimaryWatched);

    // Only proceed with updates if there's an actual change
    if (shouldUpdate && detailsToSet!) {
      // Set flag to prevent watch subscription from running
      isUpdatingFromBillToPrimary.current = true;
      
      // Set fields one by one with individual setValue calls to ensure proper updates
      form.setValue('billToPrimary', detailsToSet.billToPrimary);
      form.setValue('firstName', detailsToSet.firstName || '');
      form.setValue('lastName', detailsToSet.lastName || '');
      // Use shouldDirty and shouldTouch to ensure the phone field updates properly
      form.setValue('mobileNumber', detailsToSet.mobileNumber || '', { 
        shouldDirty: true, 
        shouldTouch: true,
        shouldValidate: true 
      });
      form.setValue('emailAddress', detailsToSet.emailAddress || '');
      
      // Also update the store with these values - include ALL form fields
      const billingDataForStore = {
        title: detailsToSet.title || '',
        firstName: detailsToSet.firstName || '',
        lastName: detailsToSet.lastName || '',
        email: detailsToSet.emailAddress || '',
        phone: detailsToSet.mobileNumber || '',
        addressLine1: detailsToSet.addressLine1 || '',
        addressLine2: detailsToSet.addressLine2 || '',
        city: detailsToSet.suburb || '', 
        stateProvince: detailsToSet.stateTerritory?.name || '',
        postalCode: detailsToSet.postcode || '',
        country: detailsToSet.country?.isoCode || '',
        businessName: detailsToSet.businessName || '',
        businessNumber: detailsToSet.businessNumber || '',
      };
      
      // Update the store
      updateStoreBillingDetails(billingDataForStore);
      
      // Call prop callback if provided
      if (setBillingFormDetailsInStore) {
        setBillingFormDetailsInStore(detailsToSet);
      }
      
      // Reset flag after a short delay to allow all setValue calls to complete
      setTimeout(() => {
        isUpdatingFromBillToPrimary.current = false;
        
        // Force a final store update with all current form values to ensure everything is persisted
        const finalFormValues = form.getValues();
        const finalBillingDataForStore = {
          title: finalFormValues.title || '',
          firstName: finalFormValues.firstName || '',
          lastName: finalFormValues.lastName || '',
          email: finalFormValues.emailAddress || '',
          phone: finalFormValues.mobileNumber || '',
          addressLine1: finalFormValues.addressLine1 || '',
          addressLine2: finalFormValues.addressLine2 || '',
          city: finalFormValues.suburb || '', 
          stateProvince: finalFormValues.stateTerritory?.name || '',
          postalCode: finalFormValues.postcode || '',
          country: finalFormValues.country?.isoCode || '',
          businessName: finalFormValues.businessName || '',
          businessNumber: finalFormValues.businessNumber || '',
        };
        
        updateStoreBillingDetails(finalBillingDataForStore);
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billToPrimaryWatched, prevBillToPrimary, primaryAttendee, countries]);

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


  // Helper function to fetch and pre-select states
  const fetchAndPreselectStates = useCallback(async (countryId: number, countryIsoCode: string) => {
    setIsLoadingStates(true);
    try {
      const result = await GetState(countryId);
      const sortedStates = result.sort((a, b) => a.name.localeCompare(b.name));
      setStates(sortedStates);
      setFetchError(prev => ({...prev, states: undefined}));
      
      // Removed automatic state pre-selection
      // Users must manually select their state/territory after selecting country
    } catch (err) {
      setFetchError(prev => ({...prev, states: 'Failed to load states for the selected country.'}));
      setStates([]);
    } finally {
      setIsLoadingStates(false);
    }
  }, [form]);

  // Removed automatic country pre-selection
  // Users must manually select their country for better accuracy
  useEffect(() => {
    // No automatic country pre-selection
    // This ensures users explicitly choose their billing country
  }, [countries]);

  // Fetch states when selected country changes (manual selection)
  useEffect(() => {
    if (!selectedCountry?.id) {
      setStates([]);
      return;
    }
    
    // Use the helper function to fetch and pre-select states
    fetchAndPreselectStates(selectedCountry.id, selectedCountry.isoCode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry?.id, fetchAndPreselectStates]);
  

  // Clear state selection when country changes
  useEffect(() => {
    // Only clear if the change wasn't from our geo-preselection of state
    if (form.getValues('stateTerritory')?.countryCode !== selectedCountry?.isoCode) {
      form.setValue('stateTerritory', undefined, { shouldValidate: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <User className="w-5 h-5" />
          Booking Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem> 
              )} 
            />
            <FormField 
              control={form.control} 
              name="lastName" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem> 
              )} 
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
                
                // Special effect to handle bill to primary changes specifically for phone
                useEffect(() => {
                  if (billToPrimaryWatched && primaryAttendee?.primaryPhone && field.value !== primaryAttendee.primaryPhone) {
                    // Update the field value and ref
                    phoneRef.current = primaryAttendee.primaryPhone;
                    field.onChange(primaryAttendee.primaryPhone);
                  }
                }, [billToPrimaryWatched, primaryAttendee?.primaryPhone]);
                
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
                        value={field.value || ''} 
                        onChange={handlePhoneChange}
                        onBlur={field.onBlur}
                        // Force re-render when billToPrimary changes by using a key that includes the actual value
                        key={`phone-${billToPrimaryWatched ? 'primary' : 'custom'}-${field.value || 'empty'}`}
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      type="email"
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem> 
              )}
            />

            {/* 3. Business Name */}
            <FormField 
              control={form.control} 
              name="businessName" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem> 
              )}
            />

            {/* 4. Business Number (NEW FIELD) */}
            <FormField 
              control={form.control} 
              name="businessNumber" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Number</FormLabel> {/* Optional, so no asterisk */}
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value || ''}
                      placeholder="E.g., ABN, ACN" // Added placeholder
                    />
                  </FormControl>
                  <FormMessage /> {/* For potential validation messages if you add them later */}
                </FormItem> 
              )} 
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1 *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem> 
              )} 
            />

            {/* 3. Suburb */}
            <FormField 
              control={form.control} 
              name="suburb" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suburb *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem> 
              )} 
            />
            
            {/* 4. Postcode and State/Territory on the same line */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 4a. Postcode */}
              <FormField 
                control={form.control} 
                name="postcode" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postcode *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem> 
                )}
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
                      disabled={isLoadingStates || !selectedCountry}
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
                        {states.length > 0 ? (
                          states.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.state_code || s.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-states" disabled>
                            No states available
                          </SelectItem>
                        )}
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
      {footerContent && (
        <CardFooter className="bg-gray-50/50 border-t border-primary/10 pt-6">
          {footerContent}
        </CardFooter>
      )}
    </Card>
  );
};