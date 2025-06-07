import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { notFound } from 'next/navigation';
import VenuePage from '@/app/(public)/functions/[slug]/venue/page';
import { resolveFunctionSlug } from '@/lib/utils/function-slug-resolver';
import { createClient } from '@/utils/supabase/server';

// Mock dependencies
vi.mock('next/navigation', () => ({
  notFound: vi.fn()
}));

vi.mock('@/lib/utils/function-slug-resolver', () => ({
  resolveFunctionSlug: vi.fn()
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn()
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => {
  const React = require('react');
  return {
    MapPin: () => React.createElement('div', { 'data-testid': 'map-pin-icon' }, 'MapPin'),
    Phone: () => React.createElement('div', { 'data-testid': 'phone-icon' }, 'Phone'),
    Globe: () => React.createElement('div', { 'data-testid': 'globe-icon' }, 'Globe'),
    Mail: () => React.createElement('div', { 'data-testid': 'mail-icon' }, 'Mail'),
    Clock: () => React.createElement('div', { 'data-testid': 'clock-icon' }, 'Clock'),
    Car: () => React.createElement('div', { 'data-testid': 'car-icon' }, 'Car')
  };
});

// Mock UI components
vi.mock('@/components/ui/card', () => {
  const React = require('react');
  return {
    Card: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card', ...props }, children),
    CardContent: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card-content', ...props }, children),
    CardDescription: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card-description', ...props }, children),
    CardHeader: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card-header', ...props }, children),
    CardTitle: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card-title', ...props }, children)
  };
});

describe('VenuePage Component', () => {
  const mockSupabaseClient = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn()
  };

  const mockLocationData = {
    location_id: 'location-123',
    place_name: 'Grand Masonic Hall',
    street_address: '279 Castlereagh Street',
    suburb: 'Sydney',
    state: 'NSW',
    postal_code: '2000',
    country: 'Australia',
    phone: '+61 2 9284 2800',
    email: 'events@masons.au',
    website: 'https://www.masons.au',
    description: 'The premier Masonic venue in Sydney, featuring elegant halls and modern facilities.',
    parking_info: 'Limited parking available. Public parking nearby.',
    public_transport_info: 'Close to Museum Station and bus routes.',
    accessibility_info: 'Wheelchair accessible entrance and lifts available.',
    image_urls: [
      'https://supabase.storage/hall-main.jpg',
      'https://supabase.storage/hall-dining.jpg'
    ],
    google_maps_embed_url: 'https://www.google.com/maps/embed?pb=!1m18...',
    latitude: -33.8734,
    longitude: 151.2070
  };

  const mockFunctionData = {
    function_id: 'function-123',
    name: 'Grand Proclamation 2025',
    location_id: 'location-123',
    locations: mockLocationData
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup Supabase mock chain
    mockSupabaseClient.single.mockResolvedValue({
      data: mockFunctionData,
      error: null
    });
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    
    (createClient as any).mockResolvedValue(mockSupabaseClient);
    (resolveFunctionSlug as any).mockResolvedValue('function-123');
  });

  describe('Successful venue page rendering', () => {
    it('should render venue page with complete location data', async () => {
      const props = {
        params: Promise.resolve({ slug: 'grand-proclamation-2025' })
      };

      render(await VenuePage(props));

      await waitFor(() => {
        expect(screen.getByText('Venue Information')).toBeInTheDocument();
        expect(screen.getByText('Grand Masonic Hall')).toBeInTheDocument();
        expect(screen.getByText('279 Castlereagh Street')).toBeInTheDocument();
        expect(screen.getByText('Sydney NSW 2000')).toBeInTheDocument();
        expect(screen.getByText('+61 2 9284 2800')).toBeInTheDocument();
        expect(screen.getByText('events@masons.au')).toBeInTheDocument();
        expect(screen.getByText('Visit Website')).toBeInTheDocument();
      });
    });

    it('should render venue description and amenities when available', async () => {
      const props = {
        params: Promise.resolve({ slug: 'grand-proclamation-2025' })
      };

      render(await VenuePage(props));

      await waitFor(() => {
        expect(screen.getByText(mockLocationData.description)).toBeInTheDocument();
        expect(screen.getByText('Additional Information')).toBeInTheDocument();
        expect(screen.getByText(mockLocationData.parking_info)).toBeInTheDocument();
        expect(screen.getByText(mockLocationData.public_transport_info)).toBeInTheDocument();
        expect(screen.getByText(mockLocationData.accessibility_info)).toBeInTheDocument();
      });
    });

    it('should generate correct Google Maps URL', async () => {
      const props = {
        params: Promise.resolve({ slug: 'grand-proclamation-2025' })
      };

      render(await VenuePage(props));

      await waitFor(() => {
        const mapsLink = screen.getByText('View on Google Maps');
        expect(mapsLink).toBeInTheDocument();
        expect(mapsLink.closest('a')).toHaveAttribute('href', 
          'https://www.google.com/maps/search/?api=1&query=279%20Castlereagh%20Street%2C%20Sydney%20NSW%202000%2C%20Australia'
        );
        expect(mapsLink.closest('a')).toHaveAttribute('target', '_blank');
        expect(mapsLink.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should use current database column names in query', async () => {
      const props = {
        params: Promise.resolve({ slug: 'grand-proclamation-2025' })
      };

      render(await VenuePage(props));

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('functions');
        const selectQuery = mockSupabaseClient.select.mock.calls[0][0];
        expect(selectQuery).toContain('location_id');
        expect(selectQuery).toContain('place_name');
        expect(selectQuery).toContain('street_address');
        expect(selectQuery).toContain('postal_code');
      });
    });
  });

  describe('Error handling', () => {
    it('should call notFound when function is not found', async () => {
      (resolveFunctionSlug as any).mockRejectedValue(new Error('Function not found'));

      const props = {
        params: Promise.resolve({ slug: 'invalid-slug' })
      };

      await expect(VenuePage(props)).rejects.toThrow('Function not found');
    });

    it('should call notFound when function data query fails', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Function not found' }
      });

      const props = {
        params: Promise.resolve({ slug: 'grand-proclamation-2025' })
      };

      render(await VenuePage(props));

      await waitFor(() => {
        expect(notFound).toHaveBeenCalled();
      });
    });

    it('should show fallback message when location is not assigned', async () => {
      const functionDataWithoutLocation = {
        ...mockFunctionData,
        locations: null
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: functionDataWithoutLocation,
        error: null
      });

      const props = {
        params: Promise.resolve({ slug: 'grand-proclamation-2025' })
      };

      render(await VenuePage(props));

      await waitFor(() => {
        expect(screen.getByText('Venue Information')).toBeInTheDocument();
        expect(screen.getByText('Venue information will be announced soon.')).toBeInTheDocument();
      });
    });

    it('should handle missing optional location fields gracefully', async () => {
      const incompleteLocationData = {
        ...mockLocationData,
        phone: null,
        email: null,
        website: null,
        description: null,
        parking_info: null,
        public_transport_info: null,
        accessibility_info: null
      };

      const functionDataWithIncompleteLocation = {
        ...mockFunctionData,
        locations: incompleteLocationData
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: functionDataWithIncompleteLocation,
        error: null
      });

      const props = {
        params: Promise.resolve({ slug: 'grand-proclamation-2025' })
      };

      render(await VenuePage(props));

      await waitFor(() => {
        expect(screen.getByText('Grand Masonic Hall')).toBeInTheDocument();
        expect(screen.getByText('279 Castlereagh Street')).toBeInTheDocument();
        
        // Should not render sections for missing data
        expect(screen.queryByText('Additional Information')).not.toBeInTheDocument();
      });
    });
  });

  describe('Security and validation', () => {
    it('should properly resolve function slug before making database query', async () => {
      const props = {
        params: Promise.resolve({ slug: 'grand-proclamation-2025' })
      };

      render(await VenuePage(props));

      await waitFor(() => {
        expect(resolveFunctionSlug).toHaveBeenCalledWith('grand-proclamation-2025', true);
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('function_id', 'function-123');
      });
    });

    it('should sanitize external URLs for XSS prevention', async () => {
      const locationWithMaliciousWebsite = {
        ...mockLocationData,
        website: 'javascript:alert("xss")'
      };

      const functionDataWithMaliciousData = {
        ...mockFunctionData,
        locations: locationWithMaliciousWebsite
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: functionDataWithMaliciousData,
        error: null
      });

      const props = {
        params: Promise.resolve({ slug: 'grand-proclamation-2025' })
      };

      render(await VenuePage(props));

      await waitFor(() => {
        const websiteLink = screen.getByText('Visit Website').closest('a');
        expect(websiteLink).toHaveAttribute('target', '_blank');
        expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Database integration', () => {
    it('should query function with proper location join', async () => {
      const props = {
        params: Promise.resolve({ slug: 'grand-proclamation-2025' })
      };

      render(await VenuePage(props));

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('functions');
        expect(mockSupabaseClient.select).toHaveBeenCalledWith(
          expect.stringContaining('locations (')
        );
      });
    });

    it('should include all required location fields in query', async () => {
      const props = {
        params: Promise.resolve({ slug: 'grand-proclamation-2025' })
      };

      render(await VenuePage(props));

      await waitFor(() => {
        const selectQuery = mockSupabaseClient.select.mock.calls[0][0];
        
        // Check for core location fields
        expect(selectQuery).toContain('place_name');
        expect(selectQuery).toContain('street_address');
        expect(selectQuery).toContain('suburb');
        expect(selectQuery).toContain('state');
        expect(selectQuery).toContain('postal_code');
        expect(selectQuery).toContain('country');
        
        // Check for new enhanced fields
        expect(selectQuery).toContain('phone');
        expect(selectQuery).toContain('email');
        expect(selectQuery).toContain('website');
        expect(selectQuery).toContain('description');
        expect(selectQuery).toContain('parking_info');
        expect(selectQuery).toContain('public_transport_info');
        expect(selectQuery).toContain('accessibility_info');
      });
    });
  });

  describe('Component accessibility', () => {
    it('should have proper semantic structure', async () => {
      const props = {
        params: Promise.resolve({ slug: 'grand-proclamation-2025' })
      };

      render(await VenuePage(props));

      await waitFor(() => {
        // Check for proper heading hierarchy
        expect(screen.getByRole('heading', { level: 1, name: 'Grand Masonic Hall' })).toBeInTheDocument();
        
        // Check for proper link attributes
        const externalLinks = screen.getAllByRole('link');
        externalLinks.forEach(link => {
          if (link.getAttribute('target') === '_blank') {
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
          }
        });
      });
    });

    it('should have proper ARIA labels and descriptions', async () => {
      const props = {
        params: Promise.resolve({ slug: 'grand-proclamation-2025' })
      };

      render(await VenuePage(props));

      await waitFor(() => {
        // Icons should have proper test IDs for screen readers
        expect(screen.getAllByTestId('map-pin-icon')).toHaveLength(2); // Address and button
        expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
        expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
        expect(screen.getByTestId('globe-icon')).toBeInTheDocument();
      });
    });
  });
});