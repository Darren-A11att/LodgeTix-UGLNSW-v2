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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { createFunction } from '@/app/organiser/actions'
import { useToast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const functionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().optional(),
  start_date: z.date({
    required_error: 'Start date is required',
  }),
  end_date: z.date({
    required_error: 'End date is required',
  }),
  location_id: z.string().min(1, 'Location is required'),
  image_url: z.string().url().optional().or(z.literal('')),
}).refine((data) => data.end_date >= data.start_date, {
  message: 'End date must be after start date',
  path: ['end_date'],
})

type FunctionFormData = z.infer<typeof functionSchema>

// TODO: Fetch from database
const locations = [
  { location_id: '1', name: 'Sydney Masonic Centre', city: 'Sydney' },
  { location_id: '2', name: 'Melbourne Masonic Centre', city: 'Melbourne' },
  { location_id: '3', name: 'Brisbane Masonic Centre', city: 'Brisbane' },
]

export function FunctionCreateDrawer() {
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
  } = useForm<FunctionFormData>({
    resolver: zodResolver(functionSchema),
  })

  const startDate = watch('start_date')
  const endDate = watch('end_date')

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const onSubmit = async (data: FunctionFormData) => {
    try {
      setLoading(true)
      
      const functionData = {
        ...data,
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        end_date: format(data.end_date, 'yyyy-MM-dd'),
      }

      const newFunction = await createFunction(functionData)

      toast({
        title: 'Function created',
        description: 'Your function has been created successfully.',
      })

      reset()
      setOpen(false)
      router.push(`/organiser/functions/${newFunction.function_id}`)
    } catch (error) {
      console.error('Error creating function:', error)
      toast({
        title: 'Error',
        description: 'Failed to create function. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Function
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Function</SheetTitle>
          <SheetDescription>
            Add a new function (grand installation or major event) to your organisation.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Function Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Grand Installation 2024"
              {...register('name', {
                onChange: (e) => {
                  const slug = generateSlug(e.target.value)
                  setValue('slug', slug)
                }
              })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              placeholder="e.g., grand-installation-2024"
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
              placeholder="Describe this function..."
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => setValue('start_date', date!)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => setValue('end_date', date!)}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_id">Location *</Label>
            <Select onValueChange={(value) => setValue('location_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.location_id} value={location.location_id}>
                    {location.name}, {location.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.location_id && (
              <p className="text-sm text-destructive">{errors.location_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Cover Image URL</Label>
            <Input
              id="image_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              {...register('image_url')}
            />
            {errors.image_url && (
              <p className="text-sm text-destructive">{errors.image_url.message}</p>
            )}
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
              Create Function
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}