"use client"

import type React from "react"
import { createContext, useContext, useReducer, type ReactNode } from "react"
import type { RegistrationState, RegistrationAction } from "@/lib/registration-types"
import { registrationReducer, initialRegistrationState } from "@/lib/registration-reducer"

interface RegistrationContextType {
  state: RegistrationState
  dispatch: React.Dispatch<RegistrationAction>
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined)

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(registrationReducer, initialRegistrationState)

  return <RegistrationContext.Provider value={{ state, dispatch }}>{children}</RegistrationContext.Provider>
}

export function useRegistration() {
  const context = useContext(RegistrationContext)
  if (context === undefined) {
    throw new Error("useRegistration must be used within a RegistrationProvider")
  }
  return context
}
