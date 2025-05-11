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
import { CircleAlert, AlertCircle, CheckCircle, Info } from "lucide-react"

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
      icon: <Info className="h-5 w-5 text-masonic-navy" />,
      headerClass: "",
      actionClass: "bg-masonic-navy hover:bg-masonic-blue text-white",
    },
    destructive: {
      icon: <CircleAlert className="h-5 w-5 text-red-600" />,
      headerClass: "",
      actionClass: "bg-red-600 hover:bg-red-700 text-white",
    },
    success: {
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      headerClass: "",
      actionClass: "bg-green-600 hover:bg-green-700 text-white",
    },
    warning: {
      icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
      headerClass: "",
      actionClass: "bg-amber-500 hover:bg-amber-600 text-white",
    }
  }

  const config = variantConfig[variant]

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="border border-masonic-navy shadow-md">
        <AlertDialogHeader className={config.headerClass}>
          <AlertDialogTitle className="flex items-center gap-2 text-masonic-navy font-semibold">
            {config.icon}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
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
            className={config.actionClass}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}