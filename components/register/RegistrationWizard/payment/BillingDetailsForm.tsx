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
    grandLodgeId?: string | null;
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
    const currentFormValues = form.getValues();
    let shouldUpdate = false;
    let detailsToSet: BillingDetails;

    if (billToPrimaryWatched && primaryAttendee) {
      // Check if we need to update - only update if values are different
      const needsUpdate = 
        currentFormValues.firstName !== primaryAttendee.firstName ||
        currentFormValues.lastName !== primaryAttendee.lastName ||
        currentFormValues.mobileNumber !== primaryAttendee.primaryPhone ||
        currentFormValues.emailAddress !== primaryAttendee.primaryEmail;
      
      if (needsUpdate) {
        shouldUpdate = true;
        // When checkbox is checked and we have primary attendee data
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
        if (primaryAttendee.attendeeType === 'Mason' && primaryAttendee.grandLodgeId) {
          console.log('Mason with Grand Lodge detected, fetching country...', primaryAttendee.grandLodgeId);
          // Fetch Grand Lodge data to get country
          getAllGrandLodges().then(grandLodges => {
            const grandLodge = grandLodges.find(gl => gl.id === primaryAttendee.grandLodgeId);
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
      }
    } else if (!billToPrimaryWatched && currentFormValues.billToPrimary) {
      // Only update if we're actually changing from checked to unchecked
      shouldUpdate = true;
      // When checkbox is unchecked - preserve existing data
      detailsToSet = {
        ...currentFormValues, // Preserve all fields
        billToPrimary: false,
      };
    }

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
  }, [billToPrimaryWatched, countries]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries, ipCountryIsoCode, hasAttemptedGeoCountryPreselection]);

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
        typeof ipStateName === 'string' && 
        ipStateName && 
        !hasAttemptedGeoStatePreselection && 
        !form.getValues('stateTerritory')) {
      
      // Only proceed if ipStateName is a string (already checked above)
      const stateName = ipStateName as string;
      const geoState = states.find(s => 
        s.name.toLowerCase() === stateName.toLowerCase()
      );
      
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states, selectedCountry, ipCountryIsoCode, ipStateName, hasAttemptedGeoStatePreselection]);

  // Clear state selection when country changes
  useEffect(() => {
    // Only clear if the change wasn't from our geo-preselection of state
    if (form.getValues('stateTerritory')?.countryCode !== selectedCountry?.isoCode) {
      form.setValue('stateTerritory', undefined, { shouldValidate: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

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