import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimeSlotSelection } from '@/components/booking/time-slot-selection';
import { BookingProvider } from '@/contexts/booking-context';
import * as api from '@/lib/api';

// Mock the API
jest.mock('@/lib/api');
const mockAPI = api as jest.Mocked<typeof api>;

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BookingProvider>
      {children}
    </BookingProvider>
  </QueryClientProvider>
);

describe('Booking Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful capacity API response
    mockAPI.capacityAPI.getAvailability.mockResolvedValue({
      data: {
        slots: [
          {
            timeSlot: '09:00-10:00',
            quota: 2,
            reserved: 0,
            bookable: true,
          }
        ]
      }
    });
  });

  it('should redirect to payment page on successful booking', async () => {
    const user = userEvent.setup();
    
    mockAPI.bookingsAPI.hold.mockResolvedValue({
      data: { id: 'booking-123' }
    });

    render(
      <TestWrapper>
        <TimeSlotSelection onNext={jest.fn()} onPrev={jest.fn()} />
      </TestWrapper>
    );

    // Wait for slots to load
    await waitFor(() => {
      expect(screen.getByText('09:00-10:00')).toBeInTheDocument();
    });

    // Select time slot
    await user.click(screen.getByText('09:00-10:00'));
    
    // Click book button
    await user.click(screen.getByText('ยืนยันการจอง'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/liff/pay/booking-123');
    });
  });

  it('should show toast on 409 conflict', async () => {
    const user = userEvent.setup();
    
    mockAPI.bookingsAPI.hold.mockRejectedValue({
      response: { status: 409 }
    });

    render(
      <TestWrapper>
        <TimeSlotSelection onNext={jest.fn()} onPrev={jest.fn()} />
      </TestWrapper>
    );

    // Wait for slots to load
    await waitFor(() => {
      expect(screen.getByText('09:00-10:00')).toBeInTheDocument();
    });

    // Select and book
    await user.click(screen.getByText('09:00-10:00'));
    await user.click(screen.getByText('ยืนยันการจอง'));

    // Should refetch availability after conflict
    await waitFor(() => {
      expect(mockAPI.capacityAPI.getAvailability).toHaveBeenCalledTimes(2);
    });
  });
});