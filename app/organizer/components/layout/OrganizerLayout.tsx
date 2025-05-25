'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  CalendarDays, 
  ChartBar, 
  CreditCard, 
  Home, 
  Menu,
  Settings,
  X,
  ChevronDown,
  Bell,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { MasonicLogo } from '@/components/masonic-logo'
import { Badge } from '@/components/ui/badge'

const navigation = [
  { name: 'Dashboard', href: '/organizer/dashboard', icon: Home },
  { name: 'My Functions', href: '/organizer/functions', icon: CalendarDays },
  { name: 'Reports', href: '/organizer/reports', icon: ChartBar },
  { name: 'Payments', href: '/organizer/stripe/dashboard', icon: CreditCard },
  { name: 'Settings', href: '/organizer/settings', icon: Settings },
]

interface OrganizerLayoutProps {
  children: React.ReactNode
  user?: {
    name: string
    email: string
    image?: string
    stripeConnected?: boolean
  }
  recentFunctions?: Array<{
    id: string
    name: string
    slug: string
    initial: string
  }>
}

export function OrganizerLayout({ 
  children, 
  user = { name: 'John Smith', email: 'john@lodge.org' },
  recentFunctions = []
}: OrganizerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const SidebarContent = () => (
    <>
      <div className="flex h-16 shrink-0 items-center">
        <MasonicLogo className="h-8 w-auto" />
      </div>
      
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? 'bg-gray-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
          
          {recentFunctions.length > 0 && (
            <li>
              <div className="text-xs font-semibold leading-6 text-gray-400">
                Recent Functions
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {recentFunctions.map((func) => (
                  <li key={func.id}>
                    <Link
                      href={`/organizer/functions/${func.slug}`}
                      className={cn(
                        'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border',
                          'border-gray-200 bg-white text-[0.625rem] font-medium text-gray-400',
                          'group-hover:border-indigo-600 group-hover:text-indigo-600'
                        )}
                      >
                        {func.initial}
                      </span>
                      <span className="truncate">{func.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          )}
          
          <li className="mt-auto">
            <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            {!user.stripeConnected && (
              <Link
                href="/organizer/stripe/onboarding"
                className="mx-2 mb-2 block"
              >
                <Badge variant="destructive" className="w-full justify-center">
                  Connect Stripe Account
                </Badge>
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </>
  )

  return (
    <>
      <div>
        {/* Mobile sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
            <SidebarContent />
          </div>
        </div>

        <div className="lg:pl-72">
          {/* Header */}
          <div className="sticky top-0 z-40 lg:mx-auto lg:max-w-7xl lg:px-8">
            <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open sidebar</span>
              </Button>

              {/* Separator */}
              <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

              <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                {/* Search */}
                <form className="relative flex flex-1" action="#" method="GET">
                  <label htmlFor="search-field" className="sr-only">
                    Search
                  </label>
                  <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400" />
                  <Input
                    id="search-field"
                    className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                    placeholder="Search..."
                    type="search"
                    name="search"
                  />
                </form>
                
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                  {/* Notifications */}
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-6 w-6" />
                    <span className="sr-only">View notifications</span>
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                  </Button>

                  {/* Separator */}
                  <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

                  {/* Profile dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative flex items-center p-1.5">
                        <span className="sr-only">Open user menu</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="hidden lg:flex lg:items-center">
                          <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                            {user.name}
                          </span>
                          <ChevronDown className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/organizer/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/organizer/settings">Settings</Link>
                      </DropdownMenuItem>
                      {user.stripeConnected && (
                        <DropdownMenuItem asChild>
                          <Link href="/organizer/stripe/dashboard">Stripe Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Sign out</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <main className="py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}