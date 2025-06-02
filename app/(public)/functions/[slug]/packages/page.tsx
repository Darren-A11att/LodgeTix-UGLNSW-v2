import { notFound } from 'next/navigation'

interface FunctionPackagesPageProps {
  params: Promise<{ slug: string }>
}

export default async function FunctionPackagesPage({ params }: FunctionPackagesPageProps) {
  const { slug } = await params
  
  return (
    <div>
      <h1>Packages for Function: {slug}</h1>
      <p>This page will list all packages for this function</p>
    </div>
  )
}
