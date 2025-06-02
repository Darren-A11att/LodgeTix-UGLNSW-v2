'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { createEvent } from '@/app/(portals)/organiser/actions'
import { useToast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DateTimePicker } from '@/components/ui/date-time-picker'

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().optional(),
  event_start: z.date({
    required_error: 'Start date is required',
  }),
  event_end: z.date({
    required_error: 'End date is required',
  }),
  location: z.string().optional(),
  type: z.string().min(1, 'Event type is required'),
  category: z.string().optional(),
  dress_code: z.string().optional(),
  regalia: z.string().optional(),
  is_purchasable_individually: z.boolean().default(true),
  event_includes: z.string().optional(),
  important_information: z.string().optional(),
}).refine((data) => data.event_end >= data.event_start, {
  message: 'End time must be after start time',
  path: ['event_end'],
})

type EventFormData = z.infer<typeof eventSchema>

const eventTypes = [
  { value: 'ceremony', label: 'Ceremony' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'social', label: 'Social Event' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'other', label: 'Other' },
]

const eventCategories = [
  { value: 'formal', label: 'Formal' },
  { value: 'informal', label: 'Informal' },
  { value: 'educational', label: 'Educational' },
  { value: 'social', label: 'Social' },
  { value: 'ceremonial', label: 'Ceremonial' },
]

interface EventCreateDrawerProps {
  functionId: string
}

export function EventCreateDrawer({ functionId }: EventCreateDrawerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      is_purchasable_individually: true,
    }
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const onSubmit = async (data: EventFormData) => {
    try {
      setLoading(true)
      
      const eventData = {
        ...data,
        event_start: data.event_start.toISOString(),
        event_end: data.event_end.toISOString(),
        event_includes: data.event_includes?.split('\n').filter(Boolean),
      }

      await createEvent(functionId, eventData)

      toast({
        title: 'Event created',
        description: 'Your event has been created successfully.',
      })

      reset()
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error creating event:', error)
      toast({
        title: 'Error',
        description: 'Failed to create event. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Event</SheetTitle>
          <SheetDescription>
            Add a new event to this function. Events can have their own tickets and pricing.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Grand Installation Ceremony"
              {...register('title', {
                onChange: (e) => {
                  const slug = generateSlug(e.target.value)
                  setValue('slug', slug)
                }
              })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              placeholder="e.g., hero-function-ceremony"
              {...register('slug')}
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe this event..."
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date & Time *</Label>
              <DateTimePicker
                date={watch('event_start')}
                setDate={(date) => setValue('event_start', date!)}
              />
              {errors.event_start && (
                <p className="text-sm text-destructive">{errors.event_start.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>End Date & Time *</Label>
              <DateTimePicker
                date={watch('event_end')}
                setDate={(date) => setValue('event_end', date!)}
              />
              {errors.event_end && (
                <p className="text-sm text-destructive">{errors.event_end.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Main Hall, Sydney Masonic Centre"
              {...register('location')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Event Type *</Label>
              <Select onValueChange={(value) => setValue('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => setValue('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {eventCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dress_code">Dress Code</Label>
              <Input
                id="dress_code"
                placeholder="e.g., Black tie"
                {...register('dress_code')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regalia">Regalia</Label>
              <Input
                id="regalia"
                placeholder="e.g., Full regalia"
                {...register('regalia')}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is_purchasable_individually">
                Purchasable Individually
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow attendees to purchase tickets for this event separately
              </p>
            </div>
            <Switch
              id="is_purchasable_individually"
              checked={watch('is_purchasable_individually')}
              onCheckedChange={(checked) => setValue('is_purchasable_individually', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_includes">Event Includes</Label>
            <Textarea
              id="event_includes"
              placeholder="Enter each inclusion on a new line..."
              rows={3}
              {...register('event_includes')}
            />
            <p className="text-sm text-muted-foreground">
              List what's included with this event (one per line)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="important_information">Important Information</Label>
            <Textarea
              id="important_information"
              placeholder="Any important details attendees should know..."
              rows={3}
              {...register('important_information')}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Event
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}