import React from "react"

/**
 * SectionHeader
 * Reusable section header for registration steps, applies consistent spacing and centering.
 *
 * Usage:
 * <SectionHeader>
 *   <h1>Title</h1>
 *   <div className="masonic-divider"></div>
 *   <p>Description</p>
 * </SectionHeader>
 */
export function SectionHeader({ children }: { children: React.ReactNode }) {
  return <div className="text-center">{children}</div>
} 