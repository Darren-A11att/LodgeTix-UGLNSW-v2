'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, UserPlus, Building2, Mail, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getBrowserClient } from '@/lib/supabase-browser'
import { MasonicLogo } from '@/components/masonic-logo'
import AutocompleteInput from '@/shared/components/AutocompleteInput'

interface Organization {
  organizer_id: string
  organization_name: string
  organization_slug: string
  organization_type: string
}

export default function OrganizerRegisterPage() {
  const [formData, setFormData] = useState({
    // User details
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Organization details
    organizationName: '',
    organizationSlug: '',
    organizationType: 'lodge',
    contactEmail: '',
    contactPhone: ''
  })
  
  const [existingOrganizations, setExistingOrganizations] = useState<Organization[]>([])
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [isNewOrganization, setIsNewOrganization] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: User details, 2: Organization selection/creation
  const router = useRouter()

  // Search for existing organizations
  const searchOrganizations = async (query: string) => {
    if (query.length < 2) return
    
    try {
      const supabase = getBrowserClient()
      const { data, error } = await supabase
        .rpc('search_organizations', { search_term: query })
      
      if (error) {
        console.error('Search error:', error)
        return
      }
      
      setExistingOrganizations(data || [])
    } catch (err) {
      console.error('Organization search error:', err)
    }
  }

  // Generate slug from organization name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Auto-generate slug when organization name changes
      ...(field === 'organizationName' && {
        organizationSlug: generateSlug(value),
        contactEmail: prev.contactEmail || prev.email // Default contact email to user email
      })
    }))
  }

  const handleOrganizationSelect = (org: Organization) => {
    setSelectedOrganization(org)
    setIsNewOrganization(false)
    setError('')
  }

  const handleCreateNewOrganization = (name: string) => {
    setIsNewOrganization(true)
    setSelectedOrganization(null)
    handleInputChange('organizationName', name)
    setError('')
  }

  const validateStep1 = () => {
    const { firstName, lastName, email, password, confirmPassword } = formData
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields')
      return false
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    
    return true
  }

  const validateStep2 = () => {
    if (!selectedOrganization && !isNewOrganization) {
      setError('Please select an existing organization or create a new one')
      return false
    }
    
    if (isNewOrganization) {
      const { organizationName, organizationSlug, contactEmail } = formData
      
      if (!organizationName.trim() || !organizationSlug.trim() || !contactEmail.trim()) {
        setError('Please fill in all required organization fields')
        return false
      }
    }
    
    return true
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
      setError('')
    }
  }

  const handleBack = () => {
    setStep(1)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep2()) return
    
    setIsLoading(true)
    setError('')

    try {
      const supabase = getBrowserClient()
      
      // Step 1: Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone
          }
        }
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!authData.user) {
        setError('Failed to create user account')
        return
      }

      // Step 2: Create person record
      const { error: personError } = await supabase
        .from('people')
        .insert({
          auth_user_id: authData.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          primary_email: formData.email,
          primary_phone: formData.phone
        })

      if (personError) {
        console.error('Person creation error:', personError)
        // Continue anyway, this is not critical for basic functionality
      }

      // Step 3: Handle organization registration
      if (selectedOrganization) {
        // Join existing organization - create user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'organizer',
            organizer_id: selectedOrganization.organizer_id
          })

        if (roleError) {
          setError('Failed to join organization. Please contact support.')
          return
        }
      } else if (isNewOrganization) {
        // Create new organization using RPC function
        const { data: orgResult, error: orgError } = await supabase
          .rpc('create_organizer_registration', {
            user_uuid: authData.user.id,
            org_name: formData.organizationName,
            org_slug: formData.organizationSlug,
            contact_email: formData.contactEmail,
            contact_phone: formData.contactPhone,
            user_role: 'admin' // First user becomes admin
          })

        if (orgError || !orgResult) {
          setError('Failed to create organization. Please try a different organization name.')
          return
        }

        const result = orgResult as any
        if (!result.success) {
          setError(result.message || 'Failed to create organization')
          return
        }
      }

      // Success! Redirect to dashboard
      router.push('/organizer/dashboard?welcome=true')
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Registration error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <MasonicLogo className="h-12 w-auto" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Register Organization
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your account and join or register your organization
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              {step === 1 ? 'Your Details' : 'Organization'}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? 'Enter your personal information' 
                : 'Select or create your organization'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="mt-1 relative">
                        <Input
                          id="firstName"
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          placeholder="John"
                          className="pl-10"
                          disabled={isLoading}
                        />
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Smith"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email address</Label>
                    <div className="mt-1 relative">
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="john@lodge.org"
                        className="pl-10"
                        disabled={isLoading}
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <div className="mt-1 relative">
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+61 400 000 000"
                        className="pl-10"
                        disabled={isLoading}
                      />
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="mt-1 relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Enter password"
                        className="pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="mt-1 relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm password"
                        className="pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    Next: Organization Details
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="organization">Find Your Organization</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      Search for your lodge or organization, or create a new one
                    </p>
                    <AutocompleteInput
                      id="organization"
                      name="organization"
                      value={selectedOrganization?.organization_name || formData.organizationName}
                      onChange={(value) => {
                        searchOrganizations(value)
                        handleInputChange('organizationName', value)
                      }}
                      onSelect={handleOrganizationSelect}
                      onCreateNew={handleCreateNewOrganization}
                      options={existingOrganizations}
                      getOptionLabel={(org) => org.organization_name}
                      getOptionValue={(org) => org.organizer_id}
                      placeholder="Search for your organization..."
                      allowCreate={true}
                      createNewText="Create organization"
                      renderOption={(org) => (
                        <div>
                          <div className="font-medium">{org.organization_name}</div>
                          <div className="text-xs text-gray-500 capitalize">{org.organization_type}</div>
                        </div>
                      )}
                      disabled={isLoading}
                    />
                  </div>

                  {selectedOrganization && !isNewOrganization && (
                    <Alert>
                      <Building2 className="h-4 w-4" />
                      <AlertDescription>
                        You will join <strong>{selectedOrganization.organization_name}</strong> as an organizer.
                        An existing admin will need to approve your access.
                      </AlertDescription>
                    </Alert>
                  )}

                  {isNewOrganization && (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">New Organization Details</h4>
                      
                      <div>
                        <Label htmlFor="organizationType">Organization Type</Label>
                        <Select
                          value={formData.organizationType}
                          onValueChange={(value) => handleInputChange('organizationType', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lodge">Lodge</SelectItem>
                            <SelectItem value="grand_lodge">Grand Lodge</SelectItem>
                            <SelectItem value="association">Association</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="organizationSlug">Organization URL</Label>
                        <div className="mt-1">
                          <div className="flex">
                            <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                              lodgetix.com/
                            </span>
                            <Input
                              id="organizationSlug"
                              type="text"
                              required
                              value={formData.organizationSlug}
                              onChange={(e) => handleInputChange('organizationSlug', e.target.value)}
                              placeholder="your-organization"
                              className="rounded-l-none"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="contactEmail">Contact Email</Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          required
                          value={formData.contactEmail}
                          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                          placeholder="secretary@yourlodge.org"
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <Label htmlFor="contactPhone">Contact Phone (optional)</Label>
                        <Input
                          id="contactPhone"
                          type="tel"
                          value={formData.contactPhone}
                          onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                          placeholder="+61 400 000 000"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </div>
                </div>
              )}
            </form>

            {step === 1 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/organizer/login" className="text-blue-600 hover:text-blue-500">
                    Sign in here
                  </Link>
                </p>
              </div>
            )}

            <div className="mt-6 text-center">
              <Button variant="ghost" asChild>
                <Link href="/">
                  ← Back to Main Site
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}