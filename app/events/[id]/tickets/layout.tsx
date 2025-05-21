import React from 'react';

export default function TicketsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  return (
    <>
      {React.cloneElement(children as React.ReactElement, { params })}
    </>
  )
}