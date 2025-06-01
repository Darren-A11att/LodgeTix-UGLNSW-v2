'use client'

import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface DateTimePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
}

export function DateTimePicker({ date, setDate, disabled }: DateTimePickerProps) {
  const [selectedDateTime, setSelectedDateTime] = React.useState<Date | undefined>(date)
  const [timeValue, setTimeValue] = React.useState<string>('')

  React.useEffect(() => {
    if (selectedDateTime) {
      const hours = selectedDateTime.getHours().toString().padStart(2, '0')
      const minutes = selectedDateTime.getMinutes().toString().padStart(2, '0')
      setTimeValue(`${hours}:${minutes}`)
    }
  }, [selectedDateTime])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const [hours, minutes] = timeValue.split(':').map(Number)
      newDate.setHours(hours || 0, minutes || 0)
      setSelectedDateTime(newDate)
      setDate(newDate)
    } else {
      setSelectedDateTime(undefined)
      setDate(undefined)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimeValue = e.target.value
    setTimeValue(newTimeValue)

    if (selectedDateTime && newTimeValue) {
      const [hours, minutes] = newTimeValue.split(':').map(Number)
      const newDateTime = new Date(selectedDateTime)
      newDateTime.setHours(hours || 0, minutes || 0)
      setSelectedDateTime(newDateTime)
      setDate(newDateTime)
    }
  }

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'flex-1 justify-start text-left font-normal',
              !selectedDateTime && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDateTime ? format(selectedDateTime, 'PPP') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDateTime}
            onSelect={handleDateSelect}
            disabled={disabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        value={timeValue}
        onChange={handleTimeChange}
        className="w-24"
      />
    </div>
  )
}