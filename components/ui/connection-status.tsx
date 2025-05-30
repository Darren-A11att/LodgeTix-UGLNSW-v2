import React from 'react'
import { cn } from '@/lib/utils'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'unknown'
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ConnectionStatus({ 
  status, 
  className, 
  showText = false,
  size = 'md' 
}: ConnectionStatusProps) {
  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }[size]
  
  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size]

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className={iconSize} />,
          text: 'Live',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          tooltip: 'Connected - Ticket availability updates in real-time'
        }
      case 'connecting':
        return {
          icon: <Loader2 className={cn(iconSize, 'animate-spin')} />,
          text: 'Connecting',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200',
          tooltip: 'Connecting to real-time updates...'
        }
      case 'disconnected':
        return {
          icon: <WifiOff className={iconSize} />,
          text: 'Offline',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          tooltip: 'Disconnected - Showing cached data'
        }
      case 'error':
        return {
          icon: <WifiOff className={iconSize} />,
          text: 'Error',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          tooltip: 'Connection error - Please refresh the page'
        }
      default:
        return {
          icon: <WifiOff className={iconSize} />,
          text: 'Unknown',
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-100',
          tooltip: 'Connection status unknown'
        }
    }
  }

  const config = getStatusConfig()

  if (status === 'unknown' || status === 'disconnected') {
    // Don't show anything for unknown or disconnected status by default
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-full border',
              config.bgColor,
              config.borderColor,
              config.color,
              className
            )}
          >
            {config.icon}
            {showText && (
              <span className={cn('font-medium', textSize)}>
                {config.text}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Minimal connection indicator (just a dot)
export function ConnectionDot({ 
  status, 
  className,
  size = 'md' 
}: Omit<ConnectionStatusProps, 'showText'>) {
  const dotSize = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3'
  }[size]

  const getColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-blue-500 animate-pulse'
      case 'error':
        return 'bg-red-500'
      case 'disconnected':
      default:
        return 'bg-gray-400'
    }
  }

  if (status === 'unknown' || status === 'disconnected') {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'rounded-full',
              dotSize,
              getColor(),
              className
            )}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {status === 'connected' && 'Real-time updates active'}
            {status === 'connecting' && 'Connecting...'}
            {status === 'error' && 'Connection error'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}