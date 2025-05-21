import React from 'react'
import { Controller, Control } from 'react-hook-form'
import { FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { FilterableCombobox } from '..'
import { CountryType } from '@/lib/billing-details-schema'

interface CountrySelectProps {
  control: Control<any>
  name: string
  countries: CountryType[]
  isLoading: boolean
  error?: string
}

export function CountrySelect({ control, name, countries, isLoading, error }: CountrySelectProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error: fieldError } }) => (
        <FormItem>
          <FormLabel>Country *</FormLabel>
          <FilterableCombobox 
            label="Country"
            items={countries} 
            placeholder={isLoading ? "Loading countries..." : "Search for a country..."}
            id="country-select"
            name={field.name}
            value={field.value || null}
            onChange={(selectedCountry: CountryType | null) => {
              field.onChange(selectedCountry)
            }}
            displayValue={(country: CountryType | null) => country?.name || ''}
            itemKey={(country: CountryType) => country.id! || country.isoCode}
            loading={isLoading}
          />
          {error && <div className="text-sm text-red-500 mt-1">{error}</div>}
          {fieldError && <FormMessage>{fieldError.message}</FormMessage>} 
        </FormItem>
      )}
    />
  )
}