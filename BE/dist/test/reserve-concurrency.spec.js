"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const capacity_service_1 = require("../src/capacity/capacity.service");
const settings_service_1 = require("../src/settings/settings.service");
const time_1 = require("../src/common/time");
const luxon_1 = require("luxon");
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
    let capacityService;
    let settingsService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                capacity_service_1.CapacityService,
                {
                    provide: settings_service_1.SettingsService,
                    useValue: {
                        getServiceArea: jest.fn().mockResolvedValue({
                            center: { lat: 16.474, lng: 102.821 },
                            radiusM: 1500,
                        }),
                    },
                },
            ],
        }).compile();
        capacityService = module.get(capacity_service_1.CapacityService);
        settingsService = module.get(settings_service_1.SettingsService);
    });
    describe('Concurrent Reservation Attempts', () => {
        it('should handle concurrent reservations atomically with quota of 5', async () => {
            const slotStart = luxon_1.DateTime.fromISO('2024-01-15T10:00:00', { zone: 'Asia/Bangkok' });
            const quota = 5;
            let successCount = 0;
            mockSupabaseRpc.mockImplementation((functionName, params) => {
                if (functionName === 'fn_reserve_slot') {
                    if (successCount < quota) {
                        successCount++;
                        return Promise.resolve({ data: true, error: null });
                    }
                    else {
                        return Promise.resolve({ data: false, error: null });
                    }
                }
                return Promise.resolve({ data: null, error: null });
            });
            const concurrentAttempts = Array.from({ length: 20 }, () => capacityService.reserveSlot(slotStart));
            const results = await Promise.all(concurrentAttempts);
            const successfulReservations = results.filter(result => result === true).length;
            const failedReservations = results.filter(result => result === false).length;
            expect(successfulReservations).toBe(quota);
            expect(failedReservations).toBe(20 - quota);
            expect(successfulReservations + failedReservations).toBe(20);
        });
        it('should handle edge case with quota of 1', async () => {
            const slotStart = luxon_1.DateTime.fromISO('2024-01-15T11:00:00', { zone: 'Asia/Bangkok' });
            let reservationCount = 0;
            mockSupabaseRpc.mockImplementation((functionName, params) => {
                if (functionName === 'fn_reserve_slot') {
                    if (reservationCount < 1) {
                        reservationCount++;
                        return Promise.resolve({ data: true, error: null });
                    }
                    else {
                        return Promise.resolve({ data: false, error: null });
                    }
                }
                return Promise.resolve({ data: null, error: null });
            });
            const concurrentAttempts = Array.from({ length: 10 }, () => capacityService.reserveSlot(slotStart));
            const results = await Promise.all(concurrentAttempts);
            const successfulReservations = results.filter(result => result === true).length;
            expect(successfulReservations).toBe(1);
        });
        it('should handle database errors gracefully', async () => {
            const slotStart = luxon_1.DateTime.fromISO('2024-01-15T12:00:00', { zone: 'Asia/Bangkok' });
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
            const slotStart = luxon_1.DateTime.fromISO('2024-01-15T13:00:00', { zone: 'Asia/Bangkok' });
            mockSupabaseRpc.mockImplementation((functionName, params) => {
                if (functionName === 'fn_release_slot') {
                    return Promise.resolve({ data: null, error: null });
                }
                return Promise.resolve({ data: null, error: null });
            });
            await expect(capacityService.releaseSlot(slotStart)).resolves.not.toThrow();
            expect(mockSupabaseRpc).toHaveBeenCalledWith('fn_release_slot', {
                p_slot_start: time_1.TimeHelper.toISO(slotStart),
            });
        });
        it('should confirm reservations correctly', async () => {
            const slotStart = luxon_1.DateTime.fromISO('2024-01-15T14:00:00', { zone: 'Asia/Bangkok' });
            mockSupabaseRpc.mockImplementation((functionName, params) => {
                if (functionName === 'fn_confirm_slot') {
                    return Promise.resolve({ data: null, error: null });
                }
                return Promise.resolve({ data: null, error: null });
            });
            await expect(capacityService.confirmSlot(slotStart)).resolves.not.toThrow();
            expect(mockSupabaseRpc).toHaveBeenCalledWith('fn_confirm_slot', {
                p_slot_start: time_1.TimeHelper.toISO(slotStart),
            });
        });
    });
    describe('Race Condition Prevention', () => {
        it('should prevent double reservation by same user', async () => {
            const slotStart = luxon_1.DateTime.fromISO('2024-01-15T15:00:00', { zone: 'Asia/Bangkok' });
            let reservationAttempts = 0;
            mockSupabaseRpc.mockImplementation((functionName, params) => {
                if (functionName === 'fn_reserve_slot') {
                    reservationAttempts++;
                    if (reservationAttempts === 1) {
                        return Promise.resolve({ data: true, error: null });
                    }
                    else {
                        return Promise.resolve({ data: false, error: null });
                    }
                }
                return Promise.resolve({ data: null, error: null });
            });
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
            const slotStart = luxon_1.DateTime.fromISO('2024-01-15T16:00:00', { zone: 'Asia/Bangkok' });
            let callCount = 0;
            mockSupabaseRpc.mockImplementation((functionName, params) => {
                if (functionName === 'fn_reserve_slot') {
                    callCount++;
                    return Promise.resolve({
                        data: callCount <= 3,
                        error: null
                    });
                }
                return Promise.resolve({ data: null, error: null });
            });
            const attempts = Array.from({ length: 7 }, () => capacityService.reserveSlot(slotStart));
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
//# sourceMappingURL=reserve-concurrency.spec.js.map