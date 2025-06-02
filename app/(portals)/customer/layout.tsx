import React from 'react'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="customer-portal">
      <nav>Customer Portal Navigation</nav>
      <main>{children}</main>
    </div>
  )
}
