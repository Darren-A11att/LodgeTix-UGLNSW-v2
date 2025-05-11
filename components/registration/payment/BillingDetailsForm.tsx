"use client"

import { useState, useEffect } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { GetCountries, GetState } from 'react-country-state-city';
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  // States for data handling
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [fetchError, setFetchError] = useState<{countries?: string, states?: string} | null>(null);

  // Form watchers
  const billToPrimaryWatched = form.watch('billToPrimary');
  const selectedCountry = form.watch('country');

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
        console.error("Error fetching countries:", err);
        setFetchError(prev => ({...prev, countries: 'Failed to load countries.'}));
      } finally {
        setIsLoadingCountries(false);
      }
    };
    
    fetchCountries();
  }, []);

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
        console.error("Error fetching states:", err);
        setFetchError(prev => ({...prev, states: 'Failed to load states for the selected country.'}));
        setStates([]);
      } finally {
        setIsLoadingStates(false);
      }
    };
    
    fetchStates();
  }, [selectedCountry?.id]);

  // Clear state selection when country changes
  useEffect(() => {
    form.setValue('stateTerritory', undefined, { shouldValidate: true });
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
              render={({ field }) => ( 
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
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
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem> 
              )} 
            />
          </div>
        </div>
        <Separator className="my-6" />
        
        {/* Row 2: Two-Column Layout for Address Details */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr] gap-x-8 relative">
          <div className="hidden md:block absolute inset-y-0 left-1/2 w-px bg-gray-300 transform -translate-x-1/2"></div>

          {/* Left Column */}
          <div className="space-y-4 md:pr-4">
            <FormField 
              control={form.control} 
              name="businessName" 
              render={({ field }) => ( 
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem> 
              )} 
            />
            <FormField 
              control={form.control} 
              name="mobileNumber" 
              render={({ field }) => ( 
                <FormItem>
                  <FormLabel>Mobile Number *</FormLabel>
                  <FormControl><Input type="tel" {...field} /></FormControl>
                  <FormMessage />
                </FormItem> 
              )} 
            />
            <FormField 
              control={form.control} 
              name="emailAddress" 
              render={({ field }) => ( 
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem> 
              )} 
            />
          </div>

          {/* Right Column */}
          <div className="space-y-4 md:pl-4">
            <FormField 
              control={form.control} 
              name="addressLine1" 
              render={({ field }) => ( 
                <FormItem>
                  <FormLabel>Address Line 1 *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem> 
              )} 
            />
            <FormField 
              control={form.control} 
              name="suburb" 
              render={({ field }) => ( 
                <FormItem>
                  <FormLabel>Suburb *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem> 
              )} 
            />
            <FormField 
              control={form.control} 
              name="postcode" 
              render={({ field }) => ( 
                <FormItem>
                  <FormLabel>Postcode *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem> 
              )} 
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Country Selection - FilterableCombobox for type-to-search */}
              <Controller
                control={form.control}
                name="country"
                render={({ field, fieldState: { error } }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FilterableCombobox<ZodCountryType>
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
              
              {/* State/Territory Selection - Standard Select Dropdown using short code */}
              <Controller
                control={form.control}
                name="stateTerritory"
                render={({ field, fieldState: { error } }) => (
                  <FormItem>
                    <FormLabel>State/Territory *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const selectedState = states.find(s => s.id.toString() === value);
                        if (selectedState) {
                          // Convert library state to our schema state
                          const stateObj: StateTerritoryType = {
                            id: selectedState.id,
                            name: selectedState.name,
                            isoCode: selectedState.state_code, // Use the state_code (short code like NSW)
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
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id.toString()}>
                            {/* Display short code if available, otherwise use full name */}
                            {state.state_code || state.name}
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