import { format, parseISO } from 'date-fns'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount / 100) // Convert cents to dollars
}

export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'EEEE, d MMMM yyyy')
  } catch {
    return dateString
  }
}

export function formatTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'h:mm a')
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'EEEE, d MMMM yyyy \'at\' h:mm a')
  } catch {
    return dateString
  }
}

export function formatName(title: string, firstName: string, lastName: string): string {
  return [title, firstName, lastName].filter(Boolean).join(' ')
}

export function formatAddress(address: string, city: string, state: string, postcode?: string): string {
  const parts = [address, city, state, postcode].filter(Boolean)
  return parts.join(', ')
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Format Australian mobile numbers
  if (digits.startsWith('61') && digits.length === 11) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
  }
  
  // Format Australian landline/mobile without country code
  if (digits.startsWith('0') && digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  
  // Return original if no pattern matches
  return phone
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`)
}