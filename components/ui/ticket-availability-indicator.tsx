import React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface TicketAvailabilityIndicatorProps {
  available: number | null
  reserved?: number
  sold?: number
  status?: string
  showNumbers?: boolean
  animate?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  previousAvailable?: number | null
}

export function TicketAvailabilityIndicator({
  available,
  reserved = 0,
  sold = 0,
  status = 'Active',
  showNumbers = true,
  animate = true,
  size = 'md',
  className,
  previousAvailable
}: TicketAvailabilityIndicatorProps) {
  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size]

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }[size]

  // Check if availability just changed
  const justChanged = previousAvailable !== undefined && previousAvailable !== available

  const getAvailabilityConfig = () => {
    if (status !== 'Active') {
      return {
        label: 'Inactive',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200',
        icon: <XCircle className={iconSize} />,
        variant: 'secondary' as const
      }
    }

    if (available === null) {
      return {
        label: 'Unlimited',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: <CheckCircle className={iconSize} />,
        variant: 'outline' as const
      }
    }

    if (available === 0) {
      return {
        label: 'Sold Out',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: <XCircle className={iconSize} />,
        variant: 'destructive' as const
      }
    }

    if (available < 10) {
      return {
        label: showNumbers ? `Only ${available} left!` : 'Low Stock',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: <AlertCircle className={iconSize} />,
        variant: 'outline' as const,
        animate: true
      }
    }

    return {
      label: showNumbers ? `${available} available` : 'In Stock',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: null,
      variant: 'outline' as const
    }
  }

  const config = getAvailabilityConfig()

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'transition-all duration-300',
        config.color,
        config.animate && animate && 'animate-pulse',
        justChanged && animate && 'animate-availability-change',
        className
      )}
    >
      <span className={cn('flex items-center gap-1', textSize)}>
        {config.icon}
        {config.label}
      </span>
    </Badge>
  )
}

// Compact version for tables
export function TicketAvailabilityBadge({
  available,
  status = 'Active',
  className
}: {
  available: number | null
  status?: string
  className?: string
}) {
  if (status !== 'Active') {
    return (
      <span className={cn('text-gray-500 text-sm', className)}>
        Inactive
      </span>
    )
  }

  if (available === null) {
    return (
      <span className={cn('text-green-600 text-sm', className)}>
        Unlimited
      </span>
    )
  }

  if (available === 0) {
    return (
      <span className={cn('text-red-600 text-sm font-medium', className)}>
        Sold Out
      </span>
    )
  }

  if (available < 10) {
    return (
      <span className={cn('text-orange-600 text-sm font-medium', className)}>
        {available} left
      </span>
    )
  }

  return (
    <span className={cn('text-gray-600 text-sm', className)}>
      {available} left
    </span>
  )
}

// Live update indicator
export function LiveUpdateIndicator({ 
  isUpdating,
  className 
}: { 
  isUpdating: boolean
  className?: string 
}) {
  if (!isUpdating) return null

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Clock className="h-3 w-3 text-blue-500 animate-spin" />
      <span className="text-xs text-blue-600">Updating...</span>
    </div>
  )
}