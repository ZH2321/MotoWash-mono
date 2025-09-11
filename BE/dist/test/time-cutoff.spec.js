"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const time_1 = require("../src/common/time");
const luxon_1 = require("luxon");
const config_1 = require("../src/common/config");
describe('Time Cutoff Logic', () => {
    beforeAll(() => {
        config_1.config.CUT_OFF_MINUTES_TODAY = 15;
    });
    describe('Current Day Cutoff', () => {
        it('should reject booking if cutoff time has passed', () => {
            const mockNow = luxon_1.DateTime.fromISO('2024-01-15T14:50:00', { zone: 'Asia/Bangkok' });
            jest.spyOn(time_1.TimeHelper, 'now').mockReturnValue(mockNow);
            const slotStart = luxon_1.DateTime.fromISO('2024-01-15T15:00:00', { zone: 'Asia/Bangkok' });
            const businessClose = '18:00:00';
            const result = time_1.TimeHelper.isCurrentDayBookable(slotStart, businessClose, 15);
            expect(result.bookable).toBe(false);
            expect(result.reason).toContain('Cutoff time passed');
        });
        it('should allow booking if within cutoff time', () => {
            const mockNow = luxon_1.DateTime.fromISO('2024-01-15T14:40:00', { zone: 'Asia/Bangkok' });
            jest.spyOn(time_1.TimeHelper, 'now').mockReturnValue(mockNow);
            const slotStart = luxon_1.DateTime.fromISO('2024-01-15T15:00:00', { zone: 'Asia/Bangkok' });
            const businessClose = '18:00:00';
            const result = time_1.TimeHelper.isCurrentDayBookable(slotStart, businessClose, 15);
            expect(result.bookable).toBe(true);
        });
        it('should allow booking for future dates regardless of cutoff', () => {
            const mockNow = luxon_1.DateTime.fromISO('2024-01-15T14:50:00', { zone: 'Asia/Bangkok' });
            jest.spyOn(time_1.TimeHelper, 'now').mockReturnValue(mockNow);
            const slotStart = luxon_1.DateTime.fromISO('2024-01-16T10:00:00', { zone: 'Asia/Bangkok' });
            const businessClose = '18:00:00';
            const result = time_1.TimeHelper.isCurrentDayBookable(slotStart, businessClose, 15);
            expect(result.bookable).toBe(true);
        });
    });
    describe('Business Closing Time', () => {
        it('should reject booking if past business closing time for today', () => {
            const mockNow = luxon_1.DateTime.fromISO('2024-01-15T18:30:00', { zone: 'Asia/Bangkok' });
            jest.spyOn(time_1.TimeHelper, 'now').mockReturnValue(mockNow);
            const slotStart = luxon_1.DateTime.fromISO('2024-01-15T19:00:00', { zone: 'Asia/Bangkok' });
            const businessClose = '18:00:00';
            const result = time_1.TimeHelper.isCurrentDayBookable(slotStart, businessClose, 15);
            expect(result.bookable).toBe(false);
            expect(result.reason).toContain('Business is closed');
        });
        it('should allow booking if within business hours', () => {
            const mockNow = luxon_1.DateTime.fromISO('2024-01-15T16:00:00', { zone: 'Asia/Bangkok' });
            jest.spyOn(time_1.TimeHelper, 'now').mockReturnValue(mockNow);
            const slotStart = luxon_1.DateTime.fromISO('2024-01-15T17:00:00', { zone: 'Asia/Bangkok' });
            const businessClose = '18:00:00';
            const result = time_1.TimeHelper.isCurrentDayBookable(slotStart, businessClose, 15);
            expect(result.bookable).toBe(true);
        });
    });
    describe('Past Slot Validation', () => {
        it('should reject booking if slot is in the past', () => {
            const mockNow = luxon_1.DateTime.fromISO('2024-01-15T15:00:00', { zone: 'Asia/Bangkok' });
            jest.spyOn(time_1.TimeHelper, 'now').mockReturnValue(mockNow);
            const slotStart = luxon_1.DateTime.fromISO('2024-01-15T14:00:00', { zone: 'Asia/Bangkok' });
            const businessClose = '18:00:00';
            const result = time_1.TimeHelper.isCurrentDayBookable(slotStart, businessClose, 15);
            expect(result.bookable).toBe(false);
            expect(result.reason).toContain('past');
        });
    });
    describe('Timezone Handling', () => {
        it('should correctly handle Asia/Bangkok timezone', () => {
            const date = luxon_1.DateTime.fromISO('2024-01-15T14:30:00', { zone: 'UTC' });
            const bangkokTime = date.setZone('Asia/Bangkok');
            expect(bangkokTime.zoneName).toBe('Asia/Bangkok');
            expect(bangkokTime.hour).toBe(21);
        });
        it('should generate correct time slots in Bangkok timezone', () => {
            const date = '2024-01-15';
            const openTime = '09:00:00';
            const closeTime = '12:00:00';
            const slotMinutes = 60;
            const slots = time_1.TimeHelper.generateTimeSlots(date, openTime, closeTime, slotMinutes);
            expect(slots).toHaveLength(3);
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
//# sourceMappingURL=time-cutoff.spec.js.map