import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { 
  Calendar,
  Home,
  Ticket,
  Users,
  Mail,
  Settings,
  BarChart3,
  FolderOpen,
  Building2,
  CreditCard,
  FileText,
  LogOut
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { OrganiserHeader } from './components/organiser-header'

interface OrganiserLayoutProps {
  children: React.ReactNode
}

export default async function OrganiserLayout({ children }: OrganiserLayoutProps) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user is an organiser through organisation_users table
  const { data: organisationUser } = await supabase
    .from('organisation_users')
    .select(`
      *,
      organisation:organisations(*)
    `)
    .eq('user_id', user.id)
    .single()

  if (!organisationUser || !organisationUser.organisation) {
    // User is not an organiser
    redirect('/organiser/unauthorized')
  }

  const organiserProfile = organisationUser.organisation

  const navigation = [
    {
      title: 'Overview',
      items: [
        { title: 'Dashboard', href: '/organiser', icon: Home },
        { title: 'Analytics', href: '/organiser/analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'Event Management',
      items: [
        { title: 'Functions', href: '/organiser/functions', icon: Calendar },
        { title: 'All Events', href: '/organiser/events', icon: FolderOpen },
        { title: 'Tickets', href: '/organiser/tickets', icon: Ticket },
      ]
    },
    {
      title: 'Attendee Management',
      items: [
        { title: 'Registrations', href: '/organiser/registrations', icon: FileText },
        { title: 'Attendees', href: '/organiser/attendees', icon: Users },
        { title: 'Contacts', href: '/organiser/contacts', icon: Mail },
      ]
    },
    {
      title: 'Financial',
      items: [
        { title: 'Payments', href: '/organiser/payments', icon: CreditCard },
        { title: 'Reports', href: '/organiser/reports', icon: FileText },
      ]
    },
    {
      title: 'Organisation',
      items: [
        { title: 'Settings', href: '/organiser/settings', icon: Settings },
        { title: 'Team', href: '/organiser/team', icon: Users },
      ]
    }
  ]

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <Sidebar variant="inset">
          <SidebarHeader>
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{organiserProfile.name}</span>
                <span className="text-xs text-muted-foreground">Organiser Portal</span>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            {navigation.map((section) => (
              <SidebarGroup key={section.title}>
                <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild>
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter>
            <div className="flex items-center gap-3 border-t px-2 py-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col text-sm">
                <span className="font-medium">{user.email}</span>
                <span className="text-xs text-muted-foreground">Administrator</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <Link href="/logout">
                  <LogOut className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <OrganiserHeader />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}