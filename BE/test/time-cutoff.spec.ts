import { TimeHelper } from '../src/common/time';
import { DateTime } from 'luxon';
import { config } from '../src/common/config';

describe('Time Cutoff Logic', () => {
  beforeAll(() => {
    // Mock config for consistent testing
    config.CUT_OFF_MINUTES_TODAY = 15;
  });

  describe('Current Day Cutoff', () => {
    it('should reject booking if cutoff time has passed', () => {
      // Mock current time as 14:50
      const mockNow = DateTime.fromISO('2024-01-15T14:50:00', { zone: 'Asia/Bangkok' });
      jest.spyOn(TimeHelper, 'now').mockReturnValue(mockNow);

      // Try to book slot at 15:00 (10 minutes from now, but cutoff is 15 minutes)
      const slotStart = DateTime.fromISO('2024-01-15T15:00:00', { zone: 'Asia/Bangkok' });
      const businessClose = '18:00:00';

      const result = TimeHelper.isCurrentDayBookable(slotStart, businessClose, 15);

      expect(result.bookable).toBe(false);
      expect(result.reason).toContain('Cutoff time passed');
    });

    it('should allow booking if within cutoff time', () => {
      // Mock current time as 14:40
      const mockNow = DateTime.fromISO('2024-01-15T14:40:00', { zone: 'Asia/Bangkok' });
      jest.spyOn(TimeHelper, 'now').mockReturnValue(mockNow);

      // Try to book slot at 15:00 (20 minutes from now, cutoff is 15 minutes)
      const slotStart = DateTime.fromISO('2024-01-15T15:00:00', { zone: 'Asia/Bangkok' });
      const businessClose = '18:00:00';

      const result = TimeHelper.isCurrentDayBookable(slotStart, businessClose, 15);

      expect(result.bookable).toBe(true);
    });

    it('should allow booking for future dates regardless of cutoff', () => {
      // Mock current time as 14:50
      const mockNow = DateTime.fromISO('2024-01-15T14:50:00', { zone: 'Asia/Bangkok' });
      jest.spyOn(TimeHelper, 'now').mockReturnValue(mockNow);

      // Try to book slot tomorrow at 10:00
      const slotStart = DateTime.fromISO('2024-01-16T10:00:00', { zone: 'Asia/Bangkok' });
      const businessClose = '18:00:00';

      const result = TimeHelper.isCurrentDayBookable(slotStart, businessClose, 15);

      expect(result.bookable).toBe(true);
    });
  });

  describe('Business Closing Time', () => {
    it('should reject booking if past business closing time for today', () => {
      // Mock current time as 18:30 (past closing)
      const mockNow = DateTime.fromISO('2024-01-15T18:30:00', { zone: 'Asia/Bangkok' });
      jest.spyOn(TimeHelper, 'now').mockReturnValue(mockNow);

      // Try to book any slot today
      const slotStart = DateTime.fromISO('2024-01-15T19:00:00', { zone: 'Asia/Bangkok' });
      const businessClose = '18:00:00';

      const result = TimeHelper.isCurrentDayBookable(slotStart, businessClose, 15);

      expect(result.bookable).toBe(false);
      expect(result.reason).toContain('Business is closed');
    });

    it('should allow booking if within business hours', () => {
      // Mock current time as 16:00
      const mockNow = DateTime.fromISO('2024-01-15T16:00:00', { zone: 'Asia/Bangkok' });
      jest.spyOn(TimeHelper, 'now').mockReturnValue(mockNow);

      // Try to book slot at 17:00
      const slotStart = DateTime.fromISO('2024-01-15T17:00:00', { zone: 'Asia/Bangkok' });
      const businessClose = '18:00:00';

      const result = TimeHelper.isCurrentDayBookable(slotStart, businessClose, 15);

      expect(result.bookable).toBe(true);
    });
  });

  describe('Past Slot Validation', () => {
    it('should reject booking if slot is in the past', () => {
      // Mock current time as 15:00
      const mockNow = DateTime.fromISO('2024-01-15T15:00:00', { zone: 'Asia/Bangkok' });
      jest.spyOn(TimeHelper, 'now').mockReturnValue(mockNow);

      // Try to book slot at 14:00 (in the past)
      const slotStart = DateTime.fromISO('2024-01-15T14:00:00', { zone: 'Asia/Bangkok' });
      const businessClose = '18:00:00';

      const result = TimeHelper.isCurrentDayBookable(slotStart, businessClose, 15);

      expect(result.bookable).toBe(false);
      expect(result.reason).toContain('past');
    });
  });

  describe('Timezone Handling', () => {
    it('should correctly handle Asia/Bangkok timezone', () => {
      const date = DateTime.fromISO('2024-01-15T14:30:00', { zone: 'UTC' });
      const bangkokTime = date.setZone('Asia/Bangkok');

      expect(bangkokTime.zoneName).toBe('Asia/Bangkok');
      expect(bangkokTime.hour).toBe(21); // UTC+7
    });

    it('should generate correct time slots in Bangkok timezone', () => {
      const date = '2024-01-15';
      const openTime = '09:00:00';
      const closeTime = '12:00:00';
      const slotMinutes = 60;

      const slots = TimeHelper.generateTimeSlots(date, openTime, closeTime, slotMinutes);

      expect(slots).toHaveLength(3); // 09:00, 10:00, 11:00
      expect(slots[0].zoneName).toBe('Asia/Bangkok');
      expect(slots[0].hour).toBe(9);
      expect(slots[1].hour).toBe(10);
      expect(slots[2].hour).toBe(11);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});