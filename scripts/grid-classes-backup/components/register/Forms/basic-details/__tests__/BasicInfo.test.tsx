import { render, screen, fireEvent } from '@testing-library/react';
import { BasicInfo } from '../BasicInfo';
import { createMockAttendee } from '../../__tests__/setup';
import { vi } from 'vitest';

describe('BasicInfo', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    data: createMockAttendee(),
    type: 'Mason' as const,
    isPrimary: true,
    onChange: mockOnChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
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