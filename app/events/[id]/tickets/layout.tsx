export default async function TicketsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  
  return (
    <>
      {React.cloneElement(children as React.ReactElement, { params: resolvedParams })}
    </>
  )
}