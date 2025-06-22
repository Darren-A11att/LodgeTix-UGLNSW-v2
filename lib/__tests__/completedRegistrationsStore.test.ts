import { renderHook, act } from '@testing-library/react';
import { useCompletedRegistrationsStore } from '../completedRegistrationsStore';

describe('CompletedRegistrationsStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    const { clearAllRegistrations } = useCompletedRegistrationsStore.getState();
    clearAllRegistrations();
  });

  it('should add a completed registration', () => {
    const { result } = renderHook(() => useCompletedRegistrationsStore());

    const testRegistration = {
      completedAt: Date.now(),
      registrationId: 'test-reg-123',
      functionId: 'func-456',
      functionStartDate: '2024-12-25',
      confirmationNumber: 'CONF-2024-001',
      paymentReference: {
        provider: 'square' as const,
        paymentId: 'sq_payment_123'
      },
      paymentStatus: 'completed',
      userId: 'user-789',
      confirmationEmails: []
    };

    act(() => {
      result.current.addCompletedRegistration(testRegistration);
    });

    const registrations = result.current.getAllRegistrations();
    expect(registrations).toHaveLength(1);
    expect(registrations[0]).toMatchObject(testRegistration);
    expect(registrations[0].expiresAt).toBeDefined();
  });

  it('should find registration by confirmation number', () => {
    const { result } = renderHook(() => useCompletedRegistrationsStore());

    const testRegistration = {
      completedAt: Date.now(),
      registrationId: 'test-reg-456',
      functionId: 'func-789',
      functionStartDate: '2024-12-25',
      confirmationNumber: 'CONF-2024-002',
      paymentReference: {
        provider: 'square' as const,
        paymentId: 'sq_payment_456'
      },
      paymentStatus: 'completed',
      userId: 'user-123',
      confirmationEmails: []
    };

    act(() => {
      result.current.addCompletedRegistration(testRegistration);
    });

    const found = result.current.getRegistrationByConfirmation('CONF-2024-002');
    expect(found).toMatchObject(testRegistration);
  });

  it('should track confirmation emails', () => {
    const { result } = renderHook(() => useCompletedRegistrationsStore());

    const testRegistration = {
      completedAt: Date.now(),
      registrationId: 'test-reg-789',
      functionId: 'func-012',
      functionStartDate: '2024-12-25',
      confirmationNumber: 'CONF-2024-003',
      paymentReference: {
        provider: 'square' as const,
        paymentId: 'sq_payment_789'
      },
      paymentStatus: 'completed',
      userId: 'user-456',
      confirmationEmails: []
    };

    act(() => {
      result.current.addCompletedRegistration(testRegistration);
    });

    const emailRecord = {
      status: 200,
      emailId: 'email-123',
      to: 'test@example.com',
      sentAt: Date.now()
    };

    act(() => {
      result.current.addConfirmationEmail('test-reg-789', emailRecord);
    });

    const updated = result.current.getRegistrationById('test-reg-789');
    expect(updated?.confirmationEmails).toHaveLength(1);
    expect(updated?.confirmationEmails[0]).toMatchObject(emailRecord);
  });

  it('should clear expired registrations', () => {
    const { result } = renderHook(() => useCompletedRegistrationsStore());

    // Add a registration with past function date (should expire)
    const expiredRegistration = {
      completedAt: Date.now() - 100 * 24 * 60 * 60 * 1000, // 100 days ago
      registrationId: 'expired-reg',
      functionId: 'func-expired',
      functionStartDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(), // 95 days ago
      confirmationNumber: 'CONF-EXPIRED',
      paymentReference: {
        provider: 'square' as const,
        paymentId: 'sq_expired'
      },
      paymentStatus: 'completed',
      userId: 'user-expired',
      confirmationEmails: []
    };

    // Add a current registration
    const currentRegistration = {
      completedAt: Date.now(),
      registrationId: 'current-reg',
      functionId: 'func-current',
      functionStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in future
      confirmationNumber: 'CONF-CURRENT',
      paymentReference: {
        provider: 'square' as const,
        paymentId: 'sq_current'
      },
      paymentStatus: 'completed',
      userId: 'user-current',
      confirmationEmails: []
    };

    act(() => {
      result.current.addCompletedRegistration(expiredRegistration);
      result.current.addCompletedRegistration(currentRegistration);
    });

    expect(result.current.getAllRegistrations()).toHaveLength(2);

    act(() => {
      result.current.clearExpiredRegistrations();
    });

    const remaining = result.current.getAllRegistrations();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].confirmationNumber).toBe('CONF-CURRENT');
  });

  it('should update existing registration if same registrationId', () => {
    const { result } = renderHook(() => useCompletedRegistrationsStore());

    const initialRegistration = {
      completedAt: Date.now(),
      registrationId: 'test-reg-update',
      functionId: 'func-update',
      functionStartDate: '2024-12-25',
      confirmationNumber: 'CONF-UPDATE-1',
      paymentReference: {
        provider: 'square' as const,
        paymentId: 'sq_payment_initial'
      },
      paymentStatus: 'pending',
      userId: 'user-update',
      confirmationEmails: []
    };

    act(() => {
      result.current.addCompletedRegistration(initialRegistration);
    });

    const updatedRegistration = {
      ...initialRegistration,
      paymentStatus: 'completed',
      paymentReference: {
        provider: 'square' as const,
        paymentId: 'sq_payment_updated'
      }
    };

    act(() => {
      result.current.addCompletedRegistration(updatedRegistration);
    });

    const registrations = result.current.getAllRegistrations();
    expect(registrations).toHaveLength(1); // Should still be 1, not 2
    expect(registrations[0].paymentStatus).toBe('completed');
    expect(registrations[0].paymentReference.paymentId).toBe('sq_payment_updated');
  });
});