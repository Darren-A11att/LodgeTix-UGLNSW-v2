import React from 'react'
import { Controller, Control } from 'react-hook-form'
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { State } from '../types'
import { CountryType, StateTerritoryType } from '@/lib/billing-details-schema'

interface StateSelectProps {
  control: Control<any>
  name: string
  states: State[]
  isLoading: boolean
  selectedCountry?: CountryType
  error?: string
  disabled?: boolean
}

export function StateSelect({ 
  control, 
  name, 
  states, 
  isLoading, 
  selectedCountry, 
  error,
  disabled = false 
}: StateSelectProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error: fieldError } }) => (
        <FormItem>
          <FormLabel>State/Territory *</FormLabel>
          <Select
            onValueChange={(value) => {
              const selectedState = states.find(s => s.id.toString() === value)
              if (selectedState) {
                const stateObj: StateTerritoryType = {
                  id: selectedState.id,
                  name: selectedState.name,
                  isoCode: selectedState.state_code,
                  countryCode: selectedCountry?.isoCode
                }
                field.onChange(stateObj)
              } else {
                field.onChange(undefined)
              }
            }}
            value={field.value?.id?.toString() || ""}
            disabled={disabled || isLoading || !selectedCountry || states.length === 0}
          >
            <FormControl>
              <SelectTrigger className="h-10">
                <SelectValue 
                  placeholder={
                    isLoading 
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
          {error && <div className="text-sm text-red-500 mt-1">{error}</div>}
          {fieldError && <FormMessage>{fieldError.message}</FormMessage>}
        </FormItem>
      )}
    />
  )
}