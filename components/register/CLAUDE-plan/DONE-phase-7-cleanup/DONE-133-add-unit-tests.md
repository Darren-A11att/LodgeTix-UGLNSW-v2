# Task 133: Add Unit Tests

## Objective
Add comprehensive unit tests for all new components and utilities to ensure reliability and maintainability.

## Dependencies
- All new components implemented
- Jest/React Testing Library setup

## Steps

1. Create test setup for forms:
```typescript
// components/register/forms/__tests__/setup.ts
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
```

2. Test core hooks:
```typescript
// components/register/forms/attendee/lib/__tests__/useAttendeeData.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAttendeeData } from '../useAttendeeData';
import { useRegistrationStore } from '@/lib/registrationStore';

jest.mock('@/lib/registrationStore');

describe('useAttendeeData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch attendee by ID', () => {
    const mockAttendee = createMockAttendee();
    (useRegistrationStore as jest.Mock).mockReturnValue({
      attendees: [mockAttendee],
      updateAttendee: jest.fn(),
      removeAttendee: jest.fn(),
    });

    const { result } = renderHook(() => useAttendeeData(mockAttendee.attendeeId));

    expect(result.current.attendee).toEqual(mockAttendee);
  });

  it('should update attendee field', () => {
    const mockUpdateAttendee = jest.fn();
    const mockAttendee = createMockAttendee();
    
    (useRegistrationStore as jest.Mock).mockReturnValue({
      attendees: [mockAttendee],
      updateAttendee: mockUpdateAttendee,
      removeAttendee: jest.fn(),
    });

    const { result } = renderHook(() => useAttendeeData(mockAttendee.attendeeId));

    act(() => {
      result.current.updateField('firstName', 'Jane');
    });

    expect(mockUpdateAttendee).toHaveBeenCalledWith(
      mockAttendee.attendeeId,
      { firstName: 'Jane' }
    );
  });
});
```

3. Test form components:
```typescript
// components/register/forms/basic-details/__tests__/BasicInfo.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BasicInfo } from '../BasicInfo';
import { createMockAttendee } from '../../__tests__/setup';

describe('BasicInfo', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    data: createMockAttendee(),
    type: 'Mason' as const,
    isPrimary: true,
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render Mason fields', () => {
    render(<BasicInfo {...defaultProps} />);

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Rank')).toBeInTheDocument();
  });

  it('should not render rank for Guest', () => {
    render(<BasicInfo {...defaultProps} type="Guest" />);

    expect(screen.queryByLabelText('Rank')).not.toBeInTheDocument();
  });

  it('should call onChange when fields are updated', () => {
    render(<BasicInfo {...defaultProps} />);

    const firstNameInput = screen.getByLabelText('First Name');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    expect(mockOnChange).toHaveBeenCalledWith('firstName', 'Jane');
  });

  it('should handle title-rank interaction for Mason', () => {
    render(<BasicInfo {...defaultProps} />);

    const titleSelect = screen.getByLabelText('Title');
    fireEvent.change(titleSelect, { target: { value: 'RW Bro' } });

    // Should update both title and rank
    expect(mockOnChange).toHaveBeenCalledWith('title', 'RW Bro');
    expect(mockOnChange).toHaveBeenCalledWith('rank', 'GL');
  });
});
```

4. Test validation utilities:
```typescript
// components/register/forms/attendee/utils/__tests__/validation.test.ts
import {
  validateEmail,
  validatePhone,
  validateAttendee,
  validateMasonRank,
} from '../validation';
import { createMockAttendee, createMockGuest } from '../../__tests__/setup';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate Australian phone numbers', () => {
      expect(validatePhone('0400000000')).toBe(true);
      expect(validatePhone('0400 000 000')).toBe(true);
      expect(validatePhone('+61400000000')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('invalid')).toBe(false);
    });
  });

  describe('validateAttendee', () => {
    it('should validate complete Mason attendee', () => {
      const mason = createMockAttendee({
        rank: 'MM',
        grandLodgeId: 'gl-123',
        lodgeId: 'lodge-456',
      });

      const result = validateAttendee(mason);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require Grand Officer details for GL rank', () => {
      const mason = createMockAttendee({
        rank: 'GL',
        grandOfficerStatus: null,
      });

      const result = validateAttendee(mason);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'grandOfficerStatus',
        message: 'Grand Officer status is required',
      });
    });

    it('should validate Guest attendee', () => {
      const guest = createMockGuest({
        contactPreference: 'Directly',
      });

      const result = validateAttendee(guest);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateMasonRank', () => {
    it('should validate title-rank combinations', () => {
      expect(validateMasonRank('Bro', 'MM')).toBe(true);
      expect(validateMasonRank('W Bro', 'IM')).toBe(true);
      expect(validateMasonRank('RW Bro', 'GL')).toBe(true);
    });

    it('should reject invalid combinations', () => {
      expect(validateMasonRank('RW Bro', 'MM')).toBe(false);
      expect(validateMasonRank('W Bro', 'GL')).toBe(false);
    });
  });
});
```

5. Test business logic:
```typescript
// components/register/forms/attendee/utils/__tests__/businessLogic.test.ts
import {
  handleTitleChange,
  shouldShowGrandOfficerFields,
  shouldShowContactFields,
  getRequiredFields,
} from '../businessLogic';
import { createMockAttendee } from '../../__tests__/setup';

describe('Business Logic', () => {
  describe('handleTitleChange', () => {
    it('should set rank to IM for W Bro', () => {
      const result = handleTitleChange('W Bro', 'MM');
      expect(result).toEqual({ title: 'W Bro', rank: 'IM' });
    });

    it('should set rank to GL for grand titles', () => {
      const result = handleTitleChange('RW Bro', 'MM');
      expect(result).toEqual({ title: 'RW Bro', rank: 'GL' });
    });

    it('should only update title for other cases', () => {
      const result = handleTitleChange('Bro', 'MM');
      expect(result).toEqual({ title: 'Bro' });
    });
  });

  describe('shouldShowGrandOfficerFields', () => {
    it('should show for Mason with GL rank', () => {
      const mason = createMockAttendee({ rank: 'GL' });
      expect(shouldShowGrandOfficerFields(mason)).toBe(true);
    });

    it('should not show for other ranks', () => {
      const mason = createMockAttendee({ rank: 'MM' });
      expect(shouldShowGrandOfficerFields(mason)).toBe(false);
    });

    it('should not show for Guest', () => {
      const guest = createMockAttendee({ attendeeType: 'Guest' });
      expect(shouldShowGrandOfficerFields(guest)).toBe(false);
    });
  });

  describe('getRequiredFields', () => {
    it('should return basic fields for all attendees', () => {
      const attendee = createMockAttendee();
      const required = getRequiredFields(attendee);
      
      expect(required).toContain('title');
      expect(required).toContain('firstName');
      expect(required).toContain('lastName');
    });

    it('should include rank for Mason', () => {
      const mason = createMockAttendee({ attendeeType: 'Mason' });
      const required = getRequiredFields(mason);
      
      expect(required).toContain('rank');
    });

    it('should include Grand Officer fields for GL rank', () => {
      const mason = createMockAttendee({ 
        rank: 'GL',
        grandOfficerStatus: 'Present'
      });
      const required = getRequiredFields(mason);
      
      expect(required).toContain('grandOfficerStatus');
      expect(required).toContain('presentGrandOfficerRole');
    });
  });
});
```

6. Test container components:
```typescript
// components/register/forms/attendee/__tests__/AttendeeWithPartner.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttendeeWithPartner } from '../AttendeeWithPartner';
import { renderWithProviders } from '../__tests__/setup';

describe('AttendeeWithPartner', () => {
  const defaultProps = {
    attendeeId: 'test-123',
    attendeeNumber: 1,
    isPrimary: true,
    allowPartner: true,
  };

  it('should render attendee form based on type', () => {
    // Setup store with a Mason attendee
    renderWithProviders(<AttendeeWithPartner {...defaultProps} />);

    // Should render Mason form
    expect(screen.getByText(/Your Details/)).toBeInTheDocument();
  });

  it('should show partner toggle when no partner exists', () => {
    renderWithProviders(<AttendeeWithPartner {...defaultProps} />);

    expect(screen.getByText('Add Partner')).toBeInTheDocument();
  });

  it('should render partner form when partner exists', async () => {
    renderWithProviders(<AttendeeWithPartner {...defaultProps} />);

    // Click add partner
    const addPartnerButton = screen.getByText('Add Partner');
    await userEvent.click(addPartnerButton);

    // Should now show partner form
    expect(screen.getByText(/Partner Details/)).toBeInTheDocument();
  });

  it('should not show partner toggle when allowPartner is false', () => {
    renderWithProviders(
      <AttendeeWithPartner {...defaultProps} allowPartner={false} />
    );

    expect(screen.queryByText('Add Partner')).not.toBeInTheDocument();
  });
});
```

7. Create test coverage report:
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:forms": "jest components/register/forms"
  },
  "jest": {
    "coveragePathIgnorePatterns": [
      "oldforms-backup",
      "__tests__/setup.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## Deliverables
- Test setup utilities
- Component tests
- Hook tests
- Utility function tests
- Business logic tests
- Coverage reports

## Success Criteria
- 80%+ test coverage
- All critical paths tested
- Tests are maintainable
- Mock data is reusable
- Tests run quickly