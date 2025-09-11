"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const admin_service_1 = require("../src/admin/admin.service");
const capacity_service_1 = require("../src/capacity/capacity.service");
const errors_1 = require("../src/common/errors");
const mockSupabaseSelect = jest.fn();
const mockSupabaseUpdate = jest.fn();
const mockSupabaseFrom = jest.fn().mockReturnValue({
    select: mockSupabaseSelect,
    update: mockSupabaseUpdate,
});
jest.mock('../src/db/supabase', () => ({
    supabaseService: {
        from: mockSupabaseFrom,
    },
}));
const mockCapacityService = {
    confirmSlot: jest.fn(),
    releaseSlot: jest.fn(),
};
describe('Booking State Transitions', () => {
    let adminService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                admin_service_1.AdminService,
                {
                    provide: capacity_service_1.CapacityService,
                    useValue: mockCapacityService,
                },
            ],
        }).compile();
        adminService = module.get(admin_service_1.AdminService);
        jest.clearAllMocks();
    });
    describe('Valid State Transitions', () => {
        const validTransitions = [
            { from: 'HOLD_PENDING_PAYMENT', to: 'AWAIT_SHOP_CONFIRM', description: 'Payment slip uploaded' },
            { from: 'HOLD_PENDING_PAYMENT', to: 'HOLD_EXPIRED', description: 'Hold expired' },
            { from: 'HOLD_PENDING_PAYMENT', to: 'CANCELLED', description: 'User cancelled' },
            { from: 'AWAIT_SHOP_CONFIRM', to: 'CONFIRMED', description: 'Admin verified payment' },
            { from: 'AWAIT_SHOP_CONFIRM', to: 'REJECTED', description: 'Admin rejected payment' },
            { from: 'CONFIRMED', to: 'PICKUP_ASSIGNED', description: 'Runner assigned' },
            { from: 'CONFIRMED', to: 'CANCELLED', description: 'Cancelled after confirmation' },
            { from: 'PICKUP_ASSIGNED', to: 'PICKED_UP', description: 'Vehicle picked up' },
            { from: 'PICKUP_ASSIGNED', to: 'NO_SHOW', description: 'Customer no show' },
            { from: 'PICKED_UP', to: 'IN_WASH', description: 'Washing started' },
            { from: 'IN_WASH', to: 'READY_FOR_RETURN', description: 'Washing completed' },
            { from: 'READY_FOR_RETURN', to: 'ON_THE_WAY_RETURN', description: 'Return journey started' },
            { from: 'ON_THE_WAY_RETURN', to: 'COMPLETED', description: 'Service completed' },
            { from: 'COMPLETED', to: 'REVIEWED', description: 'Customer reviewed' },
        ];
        validTransitions.forEach(({ from, to, description }) => {
            it(`should allow transition from ${from} to ${to} (${description})`, async () => {
                const bookingId = 'test-booking-id';
                const mockBooking = {
                    id: bookingId,
                    status: from,
                    slot_start: '2024-01-15T10:00:00Z',
                    users: { line_user_id: 'test-line-user' },
                };
                mockSupabaseSelect.mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockBooking,
                            error: null,
                        }),
                    }),
                });
                mockSupabaseUpdate.mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: { ...mockBooking, status: to },
                        error: null,
                    }),
                });
                const result = await adminService.transitionBooking(bookingId, to, 'Test notes', 'admin-id');
                expect(result.success).toBe(true);
                expect(mockSupabaseUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: to }));
            });
        });
    });
    describe('Invalid State Transitions', () => {
        const invalidTransitions = [
            { from: 'HOLD_PENDING_PAYMENT', to: 'CONFIRMED', description: 'Skip payment verification' },
            { from: 'HOLD_PENDING_PAYMENT', to: 'PICKED_UP', description: 'Jump to picked up' },
            { from: 'AWAIT_SHOP_CONFIRM', to: 'PICKUP_ASSIGNED', description: 'Skip confirmation' },
            { from: 'CONFIRMED', to: 'IN_WASH', description: 'Skip pickup assignment' },
            { from: 'PICKED_UP', to: 'COMPLETED', description: 'Skip washing process' },
            { from: 'IN_WASH', to: 'COMPLETED', description: 'Skip return process' },
            { from: 'COMPLETED', to: 'PICKED_UP', description: 'Reverse to earlier state' },
            { from: 'REJECTED', to: 'CONFIRMED', description: 'Cannot revive rejected booking' },
            { from: 'CANCELLED', to: 'CONFIRMED', description: 'Cannot revive cancelled booking' },
            { from: 'HOLD_EXPIRED', to: 'CONFIRMED', description: 'Cannot revive expired booking' },
        ];
        invalidTransitions.forEach(({ from, to, description }) => {
            it(`should reject transition from ${from} to ${to} (${description})`, async () => {
                const bookingId = 'test-booking-id';
                const mockBooking = {
                    id: bookingId,
                    status: from,
                    slot_start: '2024-01-15T10:00:00Z',
                    users: { line_user_id: 'test-line-user' },
                };
                mockSupabaseSelect.mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockBooking,
                            error: null,
                        }),
                    }),
                });
                await expect(adminService.transitionBooking(bookingId, to, 'Test notes', 'admin-id')).rejects.toThrow(errors_1.InvalidTransitionError);
            });
        });
    });
    describe('Payment Verification Flow', () => {
        it('should successfully verify payment and transition to CONFIRMED', async () => {
            const bookingId = 'test-booking-id';
            const mockBooking = {
                id: bookingId,
                status: 'AWAIT_SHOP_CONFIRM',
                slot_start: '2024-01-15T10:00:00Z',
                users: { line_user_id: 'test-line-user' },
            };
            mockSupabaseSelect.mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: mockBooking,
                        error: null,
                    }),
                }),
            });
            mockSupabaseUpdate.mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                    data: mockBooking,
                    error: null,
                }),
            });
            const result = await adminService.verifyPayment(bookingId, 'admin-id');
            expect(result.success).toBe(true);
            expect(mockCapacityService.confirmSlot).toHaveBeenCalled();
        });
        it('should reject payment verification for wrong status', async () => {
            const bookingId = 'test-booking-id';
            const mockBooking = {
                id: bookingId,
                status: 'CONFIRMED',
                slot_start: '2024-01-15T10:00:00Z',
                users: { line_user_id: 'test-line-user' },
            };
            mockSupabaseSelect.mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: mockBooking,
                        error: null,
                    }),
                }),
            });
            await expect(adminService.verifyPayment(bookingId, 'admin-id')).rejects.toThrow(errors_1.ConflictError);
        });
        it('should successfully reject payment and release capacity', async () => {
            const bookingId = 'test-booking-id';
            const mockBooking = {
                id: bookingId,
                status: 'AWAIT_SHOP_CONFIRM',
                slot_start: '2024-01-15T10:00:00Z',
                users: { line_user_id: 'test-line-user' },
            };
            mockSupabaseSelect.mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: mockBooking,
                        error: null,
                    }),
                }),
            });
            mockSupabaseUpdate.mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                    data: mockBooking,
                    error: null,
                }),
            });
            const result = await adminService.rejectPayment(bookingId, 'Invalid slip', 'admin-id');
            expect(result.success).toBe(true);
            expect(mockCapacityService.releaseSlot).toHaveBeenCalled();
        });
    });
    describe('Job Assignment Flow', () => {
        it('should successfully assign runner to confirmed booking', async () => {
            const bookingId = 'test-booking-id';
            const mockBooking = {
                id: bookingId,
                status: 'CONFIRMED',
                slot_start: '2024-01-15T10:00:00Z',
                users: { line_user_id: 'test-line-user' },
            };
            mockSupabaseSelect.mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: mockBooking,
                        error: null,
                    }),
                }),
            });
            const mockUpsert = jest.fn().mockResolvedValue({ data: {}, error: null });
            mockSupabaseFrom.mockImplementation((table) => {
                if (table === 'jobs') {
                    return { upsert: mockUpsert };
                }
                return {
                    select: mockSupabaseSelect,
                    update: mockSupabaseUpdate,
                };
            });
            mockSupabaseUpdate.mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                    data: mockBooking,
                    error: null,
                }),
            });
            const result = await adminService.assignRunner(bookingId, 'John Doe', 'admin-id');
            expect(result.success).toBe(true);
            expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
                booking_id: bookingId,
                assignee: 'John Doe',
                phase: 'pickup',
            }), expect.objectContaining({ onConflict: 'booking_id' }));
        });
        it('should reject runner assignment for unconfirmed booking', async () => {
            const bookingId = 'test-booking-id';
            const mockBooking = {
                id: bookingId,
                status: 'AWAIT_SHOP_CONFIRM',
                slot_start: '2024-01-15T10:00:00Z',
                users: { line_user_id: 'test-line-user' },
            };
            mockSupabaseSelect.mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: mockBooking,
                        error: null,
                    }),
                }),
            });
            await expect(adminService.assignRunner(bookingId, 'John Doe', 'admin-id')).rejects.toThrow(errors_1.ConflictError);
        });
    });
    describe('Final States', () => {
        const finalStates = ['COMPLETED', 'REVIEWED', 'REJECTED', 'CANCELLED', 'NO_SHOW', 'HOLD_EXPIRED'];
        finalStates.forEach(finalState => {
            it(`should not allow transitions from final state ${finalState}`, async () => {
                const bookingId = 'test-booking-id';
                const mockBooking = {
                    id: bookingId,
                    status: finalState,
                    slot_start: '2024-01-15T10:00:00Z',
                    users: { line_user_id: 'test-line-user' },
                };
                mockSupabaseSelect.mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockBooking,
                            error: null,
                        }),
                    }),
                });
                await expect(adminService.transitionBooking(bookingId, 'CONFIRMED', 'Test notes', 'admin-id')).rejects.toThrow(errors_1.InvalidTransitionError);
            });
        });
    });
});
//# sourceMappingURL=transitions.spec.js.map