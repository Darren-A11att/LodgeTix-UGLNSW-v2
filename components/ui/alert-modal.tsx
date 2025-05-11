"use client"

import React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CircleAlert, AlertCircle, CheckCircle, XCircle } from "lucide-react"

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  actionLabel?: string
  cancelLabel?: string
  onAction?: () => void
  variant?: "default" | "destructive" | "success" | "warning"
  showCancel?: boolean
}

/**
 * AlertModal - A styled modal component for alerts and confirmations
 * 
 * This component uses the UI library's AlertDialog to provide a consistent
 * alert and confirmation experience that matches the masonic design system.
 */
export function AlertModal({
  isOpen,
  onClose,
  title,
  description,
  actionLabel = "OK",
  cancelLabel = "Cancel",
  onAction,
  variant = "default",
  showCancel = false
}: AlertModalProps) {
  const variantConfig = {
    default: {
      icon: <CircleAlert className="h-6 w-6 text-masonic-navy" />,
      header: "bg-masonic-navy",
      headerText: "text-white",
      action: "bg-masonic-navy hover:bg-masonic-blue text-white",
      border: "border-masonic-navy"
    },
    destructive: {
      icon: <XCircle className="h-6 w-6 text-red-600" />,
      header: "bg-red-600",
      headerText: "text-white",
      action: "bg-red-600 hover:bg-red-700 text-white",
      border: "border-red-600"
    },
    success: {
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      header: "bg-green-600",
      headerText: "text-white",
      action: "bg-green-600 hover:bg-green-700 text-white",
      border: "border-green-600"
    },
    warning: {
      icon: <AlertCircle className="h-6 w-6 text-amber-500" />,
      header: "bg-amber-500",
      headerText: "text-white", 
      action: "bg-amber-500 hover:bg-amber-600 text-white",
      border: "border-amber-500"
    }
  }

  const config = variantConfig[variant]

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className={`${config.border} shadow-lg overflow-hidden`}>
        {/* Styled header with masonic theme */}
        <AlertDialogHeader className={`${config.header} -mx-6 -mt-6 px-6 py-4`}>
          <AlertDialogTitle className={`${config.headerText} font-semibold flex items-center gap-2`}>
            {config.icon}
            {title}
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        {/* Content with proper padding and styling */}
        <div className="py-4">
          <AlertDialogDescription className="text-gray-700 text-base">
            {description}
          </AlertDialogDescription>
        </div>
        
        {/* Footer with masonic-styled buttons */}
        <AlertDialogFooter className="gap-2">
          {(showCancel || onAction) && (
            <AlertDialogCancel 
              onClick={onClose}
              className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
            >
              {cancelLabel}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={() => {
              if (onAction) onAction();
              onClose();
            }}
            className={config.action}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}