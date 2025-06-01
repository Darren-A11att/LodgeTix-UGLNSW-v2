'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings,
  Package,
  Trash,
  Plus,
  Edit,
  DollarSign,
  Users,
  AlertTriangle
} from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { deleteFunction } from '@/app/organiser/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface FunctionSettingsTabProps {
  functionId: string
  functionData: any
  packages: any[]
}

export function FunctionSettingsTab({ functionId, functionData, packages }: FunctionSettingsTabProps) {
  const hasRegistrations = (functionData.registrations?.length || 0) > 0

  return (
    <div className="space-y-6">
      {/* Packages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Package Deals</CardTitle>
              <CardDescription>
                Offer bundled tickets at discounted prices
              </CardDescription>
            </div>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Package
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4" />
              <p>No packages created yet</p>
              <p className="text-sm mt-1">
                Create package deals to offer bundled tickets at special prices
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {packages.map((pkg) => (
                <div key={pkg.package_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{pkg.name}</h4>
                      {pkg.is_active ? (
                        <Badge className="bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(pkg.total_cost)}
                      </span>
                      {pkg.discount > 0 && (
                        <span className="text-green-600">
                          Save {formatCurrency(pkg.discount)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Function Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Function Settings</CardTitle>
          <CardDescription>
            Configure general settings for this function
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Registration Deadline</p>
              <p className="text-sm text-muted-foreground">
                Set a cutoff date for new registrations
              </p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Capacity Limits</p>
              <p className="text-sm text-muted-foreground">
                Set maximum attendees for the function
              </p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Configure automated emails for registrants
              </p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect this function
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div>
              <p className="font-medium">Archive Function</p>
              <p className="text-sm text-muted-foreground">
                Hide this function from public view but keep all data
              </p>
            </div>
            <Button variant="outline" size="sm">
              Archive
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div>
              <p className="font-medium text-destructive">Delete Function</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this function and all associated data
              </p>
              {hasRegistrations && (
                <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>This function has active registrations</span>
                </div>
              )}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  disabled={hasRegistrations}
                >
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the function
                    "{functionData.name}" and all associated events, tickets, and data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <form action={deleteFunction.bind(null, functionId)}>
                    <AlertDialogAction type="submit" className="bg-destructive text-destructive-foreground">
                      Delete Function
                    </AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}