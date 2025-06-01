import { render, screen } from '@testing-library/react'
import { FunctionCard } from '../function-card'
import { vi } from 'vitest'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  )
}))

describe('FunctionCard', () => {
  const mockFunction = {
    id: 'func-123',
    name: 'Grand Installation 2025',
    slug: 'grand-installation-2025',
    description: 'Join us for the annual Grand Installation ceremony',
    imageUrl: 'https://example.com/image.jpg',
    startDate: '2025-06-01',
    endDate: '2025-06-03',
    locationId: 'loc-123',
    organiserId: 'org-123',
    events: [
      {
        id: 'event-1',
        title: 'Opening Ceremony',
        slug: 'opening-ceremony',
        eventStart: '2025-06-01T10:00:00',
        eventEnd: '2025-06-01T12:00:00',
        functionId: 'func-123',
        functionName: 'Grand Installation 2025',
        functionSlug: 'grand-installation-2025'
      },
      {
        id: 'event-2',
        title: 'Installation Ceremony',
        slug: 'installation-ceremony',
        eventStart: '2025-06-02T14:00:00',
        eventEnd: '2025-06-02T17:00:00',
        functionId: 'func-123',
        functionName: 'Grand Installation 2025',
        functionSlug: 'grand-installation-2025'
      }
    ],
    packages: [],
    registrationCount: 150,
    metadata: {},
    minPrice: 150,
    durationDays: 3,
    location: {
      id: 'loc-123',
      name: 'Sydney Masonic Centre',
      city: 'Sydney',
      state: 'NSW'
    }
  }

  it('should render function details correctly', () => {
    render(<FunctionCard function={mockFunction} />)

    expect(screen.getByText('Grand Installation 2025')).toBeInTheDocument()
    expect(screen.getByText('Join us for the annual Grand Installation ceremony')).toBeInTheDocument()
    expect(screen.getByText('Sydney Masonic Centre, Sydney')).toBeInTheDocument()
    expect(screen.getByText('Jun 1 - Jun 3, 2025')).toBeInTheDocument()
    expect(screen.getByText('From $150')).toBeInTheDocument()
    expect(screen.getByText('2 events')).toBeInTheDocument()
    expect(screen.getByText('150 registered')).toBeInTheDocument()
  })

  it('should render correct link to function page', () => {
    render(<FunctionCard function={mockFunction} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/functions/grand-installation-2025')
  })

  it('should handle missing location gracefully', () => {
    const functionWithoutLocation = {
      ...mockFunction,
      location: undefined
    }

    render(<FunctionCard function={functionWithoutLocation} />)

    expect(screen.queryByText('Sydney Masonic Centre')).not.toBeInTheDocument()
  })

  it('should handle single day function', () => {
    const singleDayFunction = {
      ...mockFunction,
      endDate: '2025-06-01',
      durationDays: 1
    }

    render(<FunctionCard function={singleDayFunction} />)

    expect(screen.getByText('Jun 1, 2025')).toBeInTheDocument()
    expect(screen.queryByText('Jun 1 - Jun 3, 2025')).not.toBeInTheDocument()
  })

  it('should handle function with no events', () => {
    const functionWithNoEvents = {
      ...mockFunction,
      events: []
    }

    render(<FunctionCard function={functionWithNoEvents} />)

    expect(screen.getByText('0 events')).toBeInTheDocument()
  })

  it('should display correct price when minPrice is 0', () => {
    const freeFunction = {
      ...mockFunction,
      minPrice: 0
    }

    render(<FunctionCard function={freeFunction} />)

    expect(screen.getByText('Free')).toBeInTheDocument()
  })
})