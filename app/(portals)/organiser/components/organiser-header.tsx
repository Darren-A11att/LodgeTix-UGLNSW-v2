'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Download, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function OrganiserHeader() {
  const pathname = usePathname()
  
  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    return { path, label }
  })

  // Determine page actions based on current route
  const getPageActions = () => {
    if (pathname === '/organiser/functions') {
      return (
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Function
        </Button>
      )
    }
    if (pathname.includes('/events')) {
      return (
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Event
        </Button>
      )
    }
    if (pathname.includes('/registrations') || pathname.includes('/attendees')) {
      return (
        <Button size="sm" variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      )
    }
    return null
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      <div className="flex flex-1 items-center gap-4">
        <SidebarTrigger className="lg:hidden" />
        
        <Separator orientation="vertical" className="h-6 lg:hidden" />
        
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center gap-2">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.path}>{crumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-64 lg:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8"
          />
        </div>
        
        {getPageActions()}
      </div>
    </header>
  )
}