"use client"

import React from 'react'
import { format } from 'date-fns'
import { useRegistrationStore } from '@/lib/registrationStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalendarIcon, ClockIcon, MapPinIcon } from 'lucide-react'
import type { FunctionType, EventType } from '@/shared/types'

interface EventSelectionStepProps {
  function: FunctionType
  selectedEvents: string[]
  onEventsChange: (events: string[]) => void
}

export function EventSelectionStep({ 
  function: fn, 
  selectedEvents, 
  onEventsChange 
}: EventSelectionStepProps) {
  const goToNextStep = useRegistrationStore(state => state.goToNextStep)
  const goToPrevStep = useRegistrationStore(state => state.goToPrevStep)
  
  const handleEventToggle = (eventId: string) => {
    if (selectedEvents.includes(eventId)) {
      onEventsChange(selectedEvents.filter(id => id !== eventId))
    } else {
      onEventsChange([...selectedEvents, eventId])
    }
  }
  
  const handleSelectAll = () => {
    const allEventIds = fn.events.map(event => event.event_id)
    onEventsChange(allEventIds)
  }
  
  const handleDeselectAll = () => {
    onEventsChange([])
  }
  
  const handleNext = () => {
    if (selectedEvents.length > 0) {
      goToNextStep()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Events for {fn.name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Choose which events you would like to attend. You can select individual events or use a package in the next step.
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Button 
              type="button"
              variant="outline" 
              size="sm"
              onClick={handleSelectAll}
            >
              Select All
            </Button>
            <Button 
              type="button"
              variant="outline" 
              size="sm"
              onClick={handleDeselectAll}
            >
              Deselect All
            </Button>
          </div>
          
          <div className="space-y-4">
            {fn.events.map((event) => (
              <label 
                key={event.event_id} 
                className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={selectedEvents.includes(event.event_id)}
                  onCheckedChange={() => handleEventToggle(event.event_id)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {format(new Date(event.eventStart), 'EEEE, MMMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {format(new Date(event.eventStart), 'h:mm a')}
                        {event.eventEnd && (
                          <> - {format(new Date(event.eventEnd), 'h:mm a')}</>
                        )}
                      </span>
                    </div>
                    
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4" />
                        {event.location}
                      </span>
                    )}
                  </div>
                  
                  {event.dressCode && (
                    <div className="text-sm">
                      <span className="font-medium">Dress Code:</span> {event.dressCode}
                    </div>
                  )}
                  
                  {event.price && (
                    <div className="text-sm font-medium text-primary">
                      {event.price}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
          
          {selectedEvents.length === 0 && (
            <Alert className="mt-4">
              <AlertDescription>
                Please select at least one event to continue with your registration.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={goToPrevStep}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={selectedEvents.length === 0}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

export default EventSelectionStep