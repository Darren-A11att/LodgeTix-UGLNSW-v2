import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { RegistrationStoreProvider } from '@/contexts/registration-context';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <RegistrationStoreProvider>
      {children}
    </RegistrationStoreProvider>
  );
};

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data generators
export const createMockAttendee = (overrides = {}) => ({
  attendeeId: 'test-123',
  attendeeType: 'Mason',
  firstName: 'John',
  lastName: 'Doe',
  title: 'Bro',
  isPrimary: true,
  primaryEmail: 'john@example.com',
  primaryPhone: '0400000000',
  ...overrides,
});

export const createMockGuest = (overrides = {}) => ({
  ...createMockAttendee({
    attendeeType: 'Guest',
    title: 'Mr',
    ...overrides,
  }),
});