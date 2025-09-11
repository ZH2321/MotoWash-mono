import { render, screen } from '@testing-library/react';
import { SlotGrid } from '@/components/slot-grid';
import '@testing-library/jest-dom';

const mockAvailability = {
  date: '2024-01-15',
  slots: [
    {
      timeSlot: '09:00-10:00',
      quota: 2,
      reserved: 0,
      bookable: true,
    },
    {
      timeSlot: '10:00-11:00',
      quota: 2,
      reserved: 2,
      bookable: true,
    },
    {
      timeSlot: '11:00-12:00',
      quota: 2,
      reserved: 1,
      bookable: false,
      reason: 'past_15min_today',
    },
  ],
};

describe('SlotGrid', () => {
  it('should disable past slots correctly', () => {
    render(
      <SlotGrid
        availability={mockAvailability}
        selectedSlot=""
        onSlotSelect={jest.fn()}
      />
    );

    const pastSlot = screen.getByText('11:00-12:00');
    expect(pastSlot.closest('button')).toBeDisabled();
  });

  it('should show full slots as disabled', () => {
    render(
      <SlotGrid
        availability={mockAvailability}
        selectedSlot=""
        onSlotSelect={jest.fn()}
      />
    );

    const fullSlot = screen.getByText('10:00-11:00');
    expect(fullSlot.closest('button')).toBeDisabled();
  });

  it('should allow selection of available slots', () => {
    const mockOnSelect = jest.fn();
    render(
      <SlotGrid
        availability={mockAvailability}
        selectedSlot=""
        onSlotSelect={mockOnSelect}
      />
    );

    const availableSlot = screen.getByText('09:00-10:00');
    availableSlot.click();
    expect(mockOnSelect).toHaveBeenCalledWith('09:00-10:00');
  });
});