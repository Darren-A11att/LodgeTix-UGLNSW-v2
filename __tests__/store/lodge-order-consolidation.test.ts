import { useRegistrationStore } from '@/lib/registrationStore';
import { renderHook, act } from '@testing-library/react';

describe('Lodge Order Consolidation - Store Updates', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useRegistrationStore());
    act(() => {
      result.current.clearRegistration();
    });
  });

  describe('lodgeOrder consolidated property', () => {
    it('should have lodgeOrder property instead of separate lodgeTicketOrder and lodgeTableOrder', () => {
      const { result } = renderHook(() => useRegistrationStore());
      
      // Check that new property exists
      expect(result.current.lodgeOrder).toBeDefined();
      
      // Check that old properties don't exist
      expect(result.current.lodgeTicketOrder).toBeUndefined();
      expect(result.current.lodgeTableOrder).toBeUndefined();
    });

    it('should set lodge order with package-based structure', () => {
      const { result } = renderHook(() => useRegistrationStore());

      const lodgeOrderData = {
        packageId: 'pkg-123',
        catalogObjectId: 'CATALOG_123',
        packageQuantity: 2,    // User selected 2 packages
        itemQuantity: 10,      // Each package has 10 items
        packagePrice: 1950,    // Price per package
        packageName: 'Lodge Table Package',
        totalAttendees: 20,    // 2 packages × 10 items
        subtotal: 3900        // 2 × 1950
      };

      act(() => {
        result.current.setLodgeOrder(lodgeOrderData);
      });

      expect(result.current.lodgeOrder).toEqual(lodgeOrderData);
    });

    it('should clear lodge order when clearing registration', () => {
      const { result } = renderHook(() => useRegistrationStore());

      // Set lodge order
      act(() => {
        result.current.setLodgeOrder({
          packageId: 'pkg-123',
          packageQuantity: 1,
          itemQuantity: 10,
          packagePrice: 1950,
          totalAttendees: 10,
          subtotal: 1950
        });
      });

      expect(result.current.lodgeOrder).not.toBeNull();

      // Clear registration
      act(() => {
        result.current.clearRegistration();
      });

      expect(result.current.lodgeOrder).toBeNull();
    });

    it('should clear lodge order when switching registration types', () => {
      const { result } = renderHook(() => useRegistrationStore());

      // Set lodge registration type and order
      act(() => {
        result.current.setRegistrationType('lodges');
        result.current.setLodgeOrder({
          packageId: 'pkg-123',
          packageQuantity: 2,
          itemQuantity: 10,
          packagePrice: 1950,
          totalAttendees: 20,
          subtotal: 3900
        });
      });

      expect(result.current.lodgeOrder).not.toBeNull();

      // Switch to individual registration
      act(() => {
        result.current.setRegistrationType('individuals');
      });

      expect(result.current.lodgeOrder).toBeNull();
    });

    it('should persist lodge order in storage', () => {
      const { result } = renderHook(() => useRegistrationStore());

      const lodgeOrderData = {
        packageId: 'pkg-123',
        catalogObjectId: 'CATALOG_123',
        packageQuantity: 3,
        itemQuantity: 10,
        packagePrice: 1950,
        packageName: 'Premium Lodge Package',
        totalAttendees: 30,
        subtotal: 5850
      };

      act(() => {
        result.current.setLodgeOrder(lodgeOrderData);
      });

      // Simulate page reload by creating new hook instance
      const { result: newResult } = renderHook(() => useRegistrationStore());

      // Check that lodge order was persisted
      expect(newResult.current.lodgeOrder).toEqual(lodgeOrderData);
    });
  });

  describe('Lodge registration validation', () => {
    it('should validate lodge order is set before submission', () => {
      const { result } = renderHook(() => useRegistrationStore());

      // Set lodge customer details but no order
      act(() => {
        result.current.updateLodgeCustomer({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@lodge.org',
          mobile: '+61412345678'
        });
        result.current.updateLodgeDetails({
          grand_lodge_id: 'gl-123',
          lodge_id: 'l-123',
          lodgeName: 'Sydney Lodge'
        });
      });

      // Validation should fail without lodge order
      expect(result.current.isLodgeFormValid()).toBe(false);
      expect(result.current.getLodgeValidationErrors()).toContain('Package selection is required');
    });

    it('should pass validation with complete lodge order', () => {
      const { result } = renderHook(() => useRegistrationStore());

      act(() => {
        // Set all required fields
        result.current.updateLodgeCustomer({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@lodge.org',
          mobile: '+61412345678'
        });
        result.current.updateLodgeDetails({
          grand_lodge_id: 'gl-123',
          lodge_id: 'l-123',
          lodgeName: 'Sydney Lodge'
        });
        result.current.setLodgeOrder({
          packageId: 'pkg-123',
          packageQuantity: 1,
          itemQuantity: 10,
          packagePrice: 1950,
          totalAttendees: 10,
          subtotal: 1950
        });
      });

      expect(result.current.isLodgeFormValid()).toBe(true);
      expect(result.current.getLodgeValidationErrors()).toHaveLength(0);
    });
  });

  describe('Migration helpers', () => {
    it('should have helper to get package quantity from lodge order', () => {
      const { result } = renderHook(() => useRegistrationStore());

      act(() => {
        result.current.setLodgeOrder({
          packageId: 'pkg-123',
          packageQuantity: 5,
          itemQuantity: 10,
          packagePrice: 1950,
          totalAttendees: 50,
          subtotal: 9750
        });
      });

      // Helper method to get package quantity (replaces tableCount)
      const packageQuantity = result.current.lodgeOrder?.packageQuantity || 0;
      expect(packageQuantity).toBe(5);
    });

    it('should calculate total attendees correctly', () => {
      const { result } = renderHook(() => useRegistrationStore());

      act(() => {
        result.current.setLodgeOrder({
          packageId: 'pkg-123',
          packageQuantity: 3,
          itemQuantity: 10,
          packagePrice: 1950,
          totalAttendees: 30, // Should be 3 × 10
          subtotal: 5850
        });
      });

      expect(result.current.lodgeOrder?.totalAttendees).toBe(30);
      expect(result.current.lodgeOrder?.totalAttendees).toBe(
        result.current.lodgeOrder?.packageQuantity * result.current.lodgeOrder?.itemQuantity
      );
    });
  });
});