import { Test, TestingModule } from '@nestjs/testing';
import { CapacityService } from '../src/capacity/capacity.service';
import { SettingsService } from '../src/settings/settings.service';
import { TimeHelper } from '../src/common/time';
import { DateTime } from 'luxon';

// Mock the Supabase client
const mockSupabaseRpc = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseFrom = jest.fn().mockReturnValue({
  select: mockSupabaseSelect,
  rpc: mockSupabaseRpc,
});

jest.mock('../src/db/supabase', () => ({
  supabaseService: {
    from: mockSupabaseFrom,
    rpc: mockSupabaseRpc,
  },
}));

describe('Atomic Slot Reservation Under Concurrency', () => {
  let capacityService: CapacityService;
  let settingsService: SettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CapacityService,
        {
          provide: SettingsService,
          useValue: {
            getServiceArea: jest.fn().mockResolvedValue({
              center: { lat: 16.474, lng: 102.821 },
              radiusM: 1500,
            }),
          },
        },
      ],
    }).compile();

    capacityService = module.get<CapacityService>(CapacityService);
    settingsService = module.get<SettingsService>(SettingsService);
  });

  describe('Concurrent Reservation Attempts', () => {
    it('should handle concurrent reservations atomically with quota of 5', async () => {
      const slotStart = DateTime.fromISO('2024-01-15T10:00:00', { zone: 'Asia/Bangkok' });
      const quota = 5;
      let successCount = 0;
      
      // Mock the SQL function to simulate atomic reservation
      mockSupabaseRpc.mockImplementation((functionName, params) => {
        if (functionName === 'fn_reserve_slot') {
          // Simulate atomic increment with quota checking
          if (successCount < quota) {
            successCount++;
            return Promise.resolve({ data: true, error: null });
          } else {
            return Promise.resolve({ data: false, error: null });
          }
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Simulate 20 concurrent reservation attempts
      const concurrentAttempts = Array.from({ length: 20 }, () =>
        capacityService.reserveSlot(slotStart)
      );

      const results = await Promise.all(concurrentAttempts);

      // Count successful reservations
      const successfulReservations = results.filter(result => result === true).length;
      const failedReservations = results.filter(result => result === false).length;

      expect(successfulReservations).toBe(quota);
      expect(failedReservations).toBe(20 - quota);
      expect(successfulReservations + failedReservations).toBe(20);
    });

    it('should handle edge case with quota of 1', async () => {
      const slotStart = DateTime.fromISO('2024-01-15T11:00:00', { zone: 'Asia/Bangkok' });
      let reservationCount = 0;
      
      mockSupabaseRpc.mockImplementation((functionName, params) => {
        if (functionName === 'fn_reserve_slot') {
          if (reservationCount < 1) {
            reservationCount++;
            return Promise.resolve({ data: true, error: null });
          } else {
            return Promise.resolve({ data: false, error: null });
          }
        }
        return Promise.resolve({ data: null, error: null });
      });

      // 10 concurrent attempts for slot with quota 1
      const concurrentAttempts = Array.from({ length: 10 }, () =>
        capacityService.reserveSlot(slotStart)
      );

      const results = await Promise.all(concurrentAttempts);

      const successfulReservations = results.filter(result => result === true).length;
      expect(successfulReservations).toBe(1);
    });

    it('should handle database errors gracefully', async () => {
      const slotStart = DateTime.fromISO('2024-01-15T12:00:00', { zone: 'Asia/Bangkok' });
      
      mockSupabaseRpc.mockImplementation((functionName, params) => {
        if (functionName === 'fn_reserve_slot') {
          return Promise.resolve({ 
            data: null, 
            error: { message: 'Database connection failed' } 
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const result = await capacityService.reserveSlot(slotStart);
      expect(result).toBe(false);
    });

    it('should properly release reservations', async () => {
      const slotStart = DateTime.fromISO('2024-01-15T13:00:00', { zone: 'Asia/Bangkok' });
      
      mockSupabaseRpc.mockImplementation((functionName, params) => {
        if (functionName === 'fn_release_slot') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      await expect(capacityService.releaseSlot(slotStart)).resolves.not.toThrow();
      
      expect(mockSupabaseRpc).toHaveBeenCalledWith('fn_release_slot', {
        p_slot_start: TimeHelper.toISO(slotStart),
      });
    });

    it('should confirm reservations correctly', async () => {
      const slotStart = DateTime.fromISO('2024-01-15T14:00:00', { zone: 'Asia/Bangkok' });
      
      mockSupabaseRpc.mockImplementation((functionName, params) => {
        if (functionName === 'fn_confirm_slot') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      await expect(capacityService.confirmSlot(slotStart)).resolves.not.toThrow();
      
      expect(mockSupabaseRpc).toHaveBeenCalledWith('fn_confirm_slot', {
        p_slot_start: TimeHelper.toISO(slotStart),
      });
    });
  });

  describe('Race Condition Prevention', () => {
    it('should prevent double reservation by same user', async () => {
      const slotStart = DateTime.fromISO('2024-01-15T15:00:00', { zone: 'Asia/Bangkok' });
      let reservationAttempts = 0;
      
      mockSupabaseRpc.mockImplementation((functionName, params) => {
        if (functionName === 'fn_reserve_slot') {
          reservationAttempts++;
          // Only first attempt succeeds
          if (reservationAttempts === 1) {
            return Promise.resolve({ data: true, error: null });
          } else {
            return Promise.resolve({ data: false, error: null });
          }
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Simulate same user making multiple rapid requests
      const userAttempts = [
        capacityService.reserveSlot(slotStart),
        capacityService.reserveSlot(slotStart),
        capacityService.reserveSlot(slotStart),
      ];

      const results = await Promise.all(userAttempts);
      
      const successCount = results.filter(r => r === true).length;
      expect(successCount).toBe(1);
    });

    it('should handle mixed success and failure scenarios', async () => {
      const slotStart = DateTime.fromISO('2024-01-15T16:00:00', { zone: 'Asia/Bangkok' });
      let callCount = 0;
      
      mockSupabaseRpc.mockImplementation((functionName, params) => {
        if (functionName === 'fn_reserve_slot') {
          callCount++;
          // Return success for first 3 calls, then failures
          return Promise.resolve({ 
            data: callCount <= 3, 
            error: null 
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const attempts = Array.from({ length: 7 }, () =>
        capacityService.reserveSlot(slotStart)
      );

      const results = await Promise.all(attempts);
      
      const successCount = results.filter(r => r === true).length;
      const failCount = results.filter(r => r === false).length;
      
      expect(successCount).toBe(3);
      expect(failCount).toBe(4);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});