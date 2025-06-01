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
import { useLocationStore } from "@/lib/locationStore";
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
  
  // Get geolocation data from LocationStore
  const ipData = useLocationStore(state => state.ipData);
  
  // Extract country and state from ipData
  const ipCountryIsoCode = ipData?.country_code || null;
  const ipStateName = ipData?.region || null;

  const [hasAttemptedGeoCountryPreselection, setHasAttemptedGeoCountryPreselection] = useState(false);
  const [hasAttemptedGeoStatePreselection, setHasAttemptedGeoStatePreselection] = useState(false);
  
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
        console.log('Billing field changed:', name, value);
        
        // Get all current form values
        const currentValues = form.getValues();
        
        // Update Zustand store with billing details
        const billingDataForStore = {
          firstName: currentValues.firstName || '',
          lastName: currentValues.lastName || '',
          email: currentValues.emailAddress || '',
          phone: currentValues.mobileNumber || '',
          addressLine1: currentValues.addressLine1 || '',
          city: currentValues.suburb || '', 
          stateProvince: currentValues.stateTerritory?.name || '',
          postalCode: currentValues.postcode || '',
          country: currentValues.country?.isoCode || '',
          businessName: currentValues.businessName || '',
          businessNumber: currentValues.businessNumber || '',
        };
        
        // Update the store
        console.log('Updating billing details in Zustand store:', billingDataForStore);
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
      
      // Auto-populate country for Mason with Grand Lodge
      if (primaryAttendee.attendeeType === 'Mason' && primaryAttendee.grand_lodge_id) {
        console.log('Mason with Grand Lodge detected, fetching country...', primaryAttendee.grand_lodge_id);
        // Fetch Grand Lodge data to get country
        getAllGrandLodges().then(grandLodges => {
          const grandLodge = grandLodges.find(gl => gl.id === primaryAttendee.grand_lodge_id);
          if (grandLodge && grandLodge.country) {
            console.log('Found Grand Lodge country:', grandLodge.country);
            // Find matching country in the countries list
            const matchingCountry = countries.find(c => 
              c.name.toLowerCase() === grandLodge.country.toLowerCase() ||
              c.iso2.toLowerCase() === grandLodge.country.toLowerCase()
            );
            
            if (matchingCountry) {
              const countryToSet: ZodCountryType = { 
                name: matchingCountry.name, 
                isoCode: matchingCountry.iso2, 
                id: matchingCountry.id 
              };
              form.setValue('country', countryToSet, { shouldValidate: true });
              console.log('Set country to:', countryToSet.name);
            }
          }
        }).catch(err => {
          console.error('Failed to fetch Grand Lodge data:', err);
        });
      }
      
      // Log to verify the data being set
      console.log('Setting billing details from primary:', { 
        firstName: primaryAttendee.firstName,
        lastName: primaryAttendee.lastName,
        mobileNumber: primaryAttendee.primaryPhone, // Log the phone specifically
        emailAddress: primaryAttendee.primaryEmail 
      });
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
      
      // Also update the store with these values
      const billingDataForStore = {
        firstName: detailsToSet.firstName || '',
        lastName: detailsToSet.lastName || '',
        email: detailsToSet.emailAddress || '',
        phone: detailsToSet.mobileNumber || '',
        addressLine1: detailsToSet.addressLine1 || '',
        city: detailsToSet.suburb || '', 
        stateProvince: detailsToSet.stateTerritory?.name || '',
        postalCode: detailsToSet.postcode || '',
        country: detailsToSet.country?.isoCode || '',
        businessName: detailsToSet.businessName || '',
        businessNumber: detailsToSet.businessNumber || '',
      };
      
      // Update the store
      console.log('Updating billing details from "Bill to Primary" change:', billingDataForStore);
      updateStoreBillingDetails(billingDataForStore);
      
      // Call prop callback if provided
      if (setBillingFormDetailsInStore) {
        setBillingFormDetailsInStore(detailsToSet);
      }
      
      // Reset flag after a short delay to allow all setValue calls to complete
      setTimeout(() => {
        isUpdatingFromBillToPrimary.current = false;
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


  // Pre-select country based on stored billing details or IP geolocation data
  useEffect(() => {
    // Note: We allow country pre-selection from stored data as it's address-related, not personal info
    // First priority: Load from stored billing details
    if (countries.length > 0 && storeBillingDetails?.country && !form.getValues('country')) {
      // Ensure country is a string before using string methods
      const countryValue = storeBillingDetails.country;
      if (typeof countryValue === 'string') {
        const storedCountry = countries.find(c => 
          c.iso2 === countryValue || 
          c.name.toLowerCase() === countryValue.toLowerCase()
        );
        if (storedCountry) {
          const countryToSet: ZodCountryType = { 
            name: storedCountry.name, 
            isoCode: storedCountry.iso2, 
            id: storedCountry.id 
          };
          form.setValue('country', countryToSet, { shouldValidate: true });
          console.log('💳 Set country from stored billing details:', countryToSet.name);
        }
      }
    }
    // Second priority: IP geolocation
    else if (countries.length > 0 && ipCountryIsoCode && !hasAttemptedGeoCountryPreselection && !form.getValues('country')) {
      const geoCountry = countries.find(c => c.iso2 === ipCountryIsoCode);
      if (geoCountry) {
        const countryToSet: ZodCountryType = { name: geoCountry.name, isoCode: geoCountry.iso2, id: geoCountry.id };
        form.setValue('country', countryToSet, { shouldValidate: true });
        console.log('💳 Set country from geolocation:', countryToSet.name);
      }
      setHasAttemptedGeoCountryPreselection(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries, ipCountryIsoCode, hasAttemptedGeoCountryPreselection, storeBillingDetails?.country]);

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
        const sortedStates = result.sort((a, b) => a.name.localeCompare(b.name));
        setStates(sortedStates);
        setFetchError(prev => ({...prev, states: undefined}));
        
        // Pre-select state if we have geo data and haven't already pre-selected
        if (sortedStates.length > 0 && !form.getValues('stateTerritory')) {
          // Check stored billing details first
          if (storeBillingDetails?.stateProvince && typeof storeBillingDetails.stateProvince === 'string') {
            const matchingState = sortedStates.find(s => 
              s.name.toLowerCase() === storeBillingDetails.stateProvince.toLowerCase() ||
              s.state_code === storeBillingDetails.stateProvince
            );
            
            if (matchingState) {
              const stateToSet: StateTerritoryType = { 
                id: matchingState.id, 
                name: matchingState.name, 
                isoCode: matchingState.state_code, 
                countryCode: selectedCountry.isoCode 
              };
              form.setValue('stateTerritory', stateToSet, { shouldValidate: true });
              console.log('💳 Set state from stored billing details:', stateToSet.name);
            }
          }
          // Otherwise check geolocation
          else if (ipStateName && selectedCountry.isoCode === ipCountryIsoCode && !hasAttemptedGeoStatePreselection) {
            const matchingState = sortedStates.find(s => 
              s.name.toLowerCase() === ipStateName.toLowerCase() ||
              s.state_code === ipStateName
            );
            
            if (matchingState) {
              const stateToSet: StateTerritoryType = { 
                id: matchingState.id, 
                name: matchingState.name, 
                isoCode: matchingState.state_code, 
                countryCode: selectedCountry.isoCode 
              };
              form.setValue('stateTerritory', stateToSet, { shouldValidate: true });
              console.log('💳 Set state from geolocation:', stateToSet.name);
              setHasAttemptedGeoStatePreselection(true);
            }
          }
        }
      } catch (err) {
        // Handle error silently without console logs
        setFetchError(prev => ({...prev, states: 'Failed to load states for the selected country.'}));
        setStates([]);
      } finally {
        setIsLoadingStates(false);
      }
    };
    
    fetchStates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry?.id, ipStateName, ipCountryIsoCode, storeBillingDetails?.stateProvince]);
  

  // Clear state selection when country changes
  useEffect(() => {
    // Only clear if the change wasn't from our geo-preselection of state
    if (form.getValues('stateTerritory')?.countryCode !== selectedCountry?.isoCode) {
      form.setValue('stateTerritory', undefined, { shouldValidate: true });
    }
    // Reset geo state preselection flag when country changes away from geo country
    if (selectedCountry?.isoCode !== ipCountryIsoCode) {
      setHasAttemptedGeoStatePreselection(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  return (
    <Card className="border-masonic-navy shadow-md">
      <CardHeader className="bg-masonic-navy text-white">
        <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5" /> Booking Contact</CardTitle>
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
                  console.log("Phone field effect triggered:", { 
                    billToPrimaryWatched, 
                    primaryPhone: primaryAttendee?.primaryPhone,
                    currentValue: field.value
                  });
                  
                  if (billToPrimaryWatched && primaryAttendee?.primaryPhone && field.value !== primaryAttendee.primaryPhone) {
                    // Update the field value and ref
                    phoneRef.current = primaryAttendee.primaryPhone;
                    field.onChange(primaryAttendee.primaryPhone);
                    console.log("Setting phone value to:", primaryAttendee.primaryPhone);
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
    </Card>
  );
};