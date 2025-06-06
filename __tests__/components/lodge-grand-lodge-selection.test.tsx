import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LodgeSelection } from '@/components/register/Forms/mason/lib/LodgeSelection';
import { GrandLodgeSelection } from '@/components/register/Forms/mason/lib/GrandLodgeSelection';
import { useLocationStore } from '@/lib/locationStore';

// Mock the location store
vi.mock('@/lib/locationStore', () => ({
  useLocationStore: vi.fn()
}));

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}));

describe('Lodge and Grand Lodge Selection Components', () => {
  const mockLocationStore = {
    lodges: [],
    grandLodges: [],
    getLodgesByGrandLodge: vi.fn(),
    createLodge: vi.fn(),
    searchGrandLodges: vi.fn(),
    fetchInitialGrandLodges: vi.fn(),
    getUserLocation: vi.fn(),
    lodgeCache: {},
    isLoadingLodges: false,
    isLoadingGrandLodges: false,
    ipData: null,
    allLodgeSearchResults: [],
    searchAllLodgesAction: vi.fn(),
    isLoadingAllLodges: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useLocationStore as any).mockReturnValue(mockLocationStore);
  });

  describe('LodgeSelection Component', () => {
    it('should pass organisation_id in onChange callback when lodge is selected', async () => {
      const mockOnChange = vi.fn();
      const mockLodges = [
        {
          lodge_id: 'lodge-123',
          name: 'Test Lodge',
          number: 123,
          display_name: 'Test Lodge No. 123',
          grand_lodge_id: 'gl-123',
          organisation_id: 'org-456' // This should be passed
        }
      ];

      (useLocationStore as any).mockReturnValue({
        ...mockLocationStore,
        lodges: mockLodges
      });

      render(
        <LodgeSelection
          grand_lodge_id="gl-123"
          value=""
          onChange={mockOnChange}
          required={true}
        />
      );

      // Simulate selecting a lodge
      const input = screen.getByPlaceholderText(/Select from list or type to search/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Test Lodge' } });

      // Wait for dropdown to appear
      await waitFor(() => {
        const option = screen.getByText('Test Lodge No. 123');
        fireEvent.click(option);
      });

      // Verify onChange was called with lodge_id, display name, and organisation_id
      expect(mockOnChange).toHaveBeenCalledWith(
        'lodge-123',
        'Test Lodge No. 123',
        'org-456' // organisation_id should be third parameter
      );
    });

    it('should show organisation_id is required if lodge has no organisation_id', async () => {
      const mockOnChange = vi.fn();
      const mockLodges = [
        {
          lodge_id: 'lodge-123',
          name: 'Test Lodge',
          number: 123,
          display_name: 'Test Lodge No. 123',
          grand_lodge_id: 'gl-123',
          organisation_id: undefined // Missing organisation_id
        }
      ];

      (useLocationStore as any).mockReturnValue({
        ...mockLocationStore,
        lodges: mockLodges
      });

      render(
        <LodgeSelection
          grand_lodge_id="gl-123"
          value=""
          onChange={mockOnChange}
          required={true}
        />
      );

      const input = screen.getByPlaceholderText(/Select from list or type to search/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Test Lodge' } });

      await waitFor(() => {
        const option = screen.getByText('Test Lodge No. 123');
        fireEvent.click(option);
      });

      // Should still call onChange but with undefined organisation_id
      expect(mockOnChange).toHaveBeenCalledWith(
        'lodge-123',
        'Test Lodge No. 123',
        undefined
      );
    });
  });

  describe('GrandLodgeSelection Component', () => {
    it('should pass organisation_id in onChange callback when grand lodge is selected', async () => {
      const mockOnChange = vi.fn();
      const mockGrandLodges = [
        {
          grand_lodge_id: 'gl-123',
          name: 'United Grand Lodge of NSW & ACT',
          country: 'Australia',
          abbreviation: 'UGLNSW',
          organisation_id: 'org-789' // This should be passed
        }
      ];

      (useLocationStore as any).mockReturnValue({
        ...mockLocationStore,
        grandLodges: mockGrandLodges
      });

      render(
        <GrandLodgeSelection
          value=""
          onChange={mockOnChange}
          required={true}
        />
      );

      const input = screen.getByPlaceholderText(/Search Grand Lodge/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'United' } });

      await waitFor(() => {
        const option = screen.getByText('United Grand Lodge of NSW & ACT');
        fireEvent.click(option);
      });

      // Verify onChange was called with grand_lodge_id and organisation_id
      expect(mockOnChange).toHaveBeenCalledWith(
        'gl-123',
        'org-789' // organisation_id should be second parameter
      );
    });

    it('should handle grand lodge without organisation_id', async () => {
      const mockOnChange = vi.fn();
      const mockGrandLodges = [
        {
          grand_lodge_id: 'gl-123',
          name: 'Test Grand Lodge',
          country: 'Test Country',
          abbreviation: 'TGL',
          organisation_id: undefined // Missing organisation_id
        }
      ];

      (useLocationStore as any).mockReturnValue({
        ...mockLocationStore,
        grandLodges: mockGrandLodges
      });

      render(
        <GrandLodgeSelection
          value=""
          onChange={mockOnChange}
          required={true}
        />
      );

      const input = screen.getByPlaceholderText(/Search Grand Lodge/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Test' } });

      await waitFor(() => {
        const option = screen.getByText('Test Grand Lodge');
        fireEvent.click(option);
      });

      // Should call onChange with undefined organisation_id
      expect(mockOnChange).toHaveBeenCalledWith(
        'gl-123',
        undefined
      );
    });
  });
});