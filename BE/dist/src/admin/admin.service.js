"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const luxon_1 = require("luxon");
const supabase_1 = require("../db/supabase");
const capacity_service_1 = require("../capacity/capacity.service");
const time_1 = require("../common/time");
const line_1 = require("../common/line");
const errors_1 = require("../common/errors");
let AdminService = class AdminService {
    constructor(capacityService) {
        this.capacityService = capacityService;
        this.STATUS_TRANSITIONS = new Map([
            ['HOLD_PENDING_PAYMENT', ['AWAIT_SHOP_CONFIRM', 'HOLD_EXPIRED', 'CANCELLED']],
            ['AWAIT_SHOP_CONFIRM', ['CONFIRMED', 'REJECTED']],
            ['CONFIRMED', ['PICKUP_ASSIGNED', 'CANCELLED']],
            ['PICKUP_ASSIGNED', ['PICKED_UP', 'NO_SHOW']],
            ['PICKED_UP', ['IN_WASH']],
            ['IN_WASH', ['READY_FOR_RETURN']],
            ['READY_FOR_RETURN', ['ON_THE_WAY_RETURN']],
            ['ON_THE_WAY_RETURN', ['COMPLETED']],
            ['COMPLETED', ['REVIEWED']],
        ]);
        this.STATUS_MESSAGES = new Map([
            ['PICKUP_ASSIGNED', '🏃‍♂️ พนักงานกำลังเดินทางไปรับรถ'],
            ['PICKED_UP', '🚗 พนักงานรับรถเรียบร้อยแล้ว'],
            ['IN_WASH', '🧽 รถของคุณกำลังล้าง'],
            ['READY_FOR_RETURN', '✨ ล้างเสร็จแล้ว พร้อมส่งคืน'],
            ['ON_THE_WAY_RETURN', '🚚 กำลังเดินทางส่งรถคืน'],
            ['COMPLETED', '🎉 เสร็จสิ้น ขอบคุณที่ใช้บริการ'],
        ]);
        this.supabase = supabase_1.supabaseService;
    }
    async getBookings(query) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '20');
        const offset = (page - 1) * limit;
        let dbQuery = this.supabase
            .from('bookings')
            .select(`
        *,
        users(display_name, phone, line_user_id),
        payments(*),
        jobs(*),
        reviews(*)
      `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (query.date) {
            const date = luxon_1.DateTime.fromISO(query.date).setZone('Asia/Bangkok');
            const startOfDay = time_1.TimeHelper.toISO(date.startOf('day'));
            const endOfDay = time_1.TimeHelper.toISO(date.endOf('day'));
            dbQuery = dbQuery.gte('slot_start', startOfDay).lte('slot_start', endOfDay);
        }
        if (query.status) {
            dbQuery = dbQuery.eq('status', query.status);
        }
        if (query.search) {
            dbQuery = dbQuery.or(`id.ilike.%${query.search}%,users.display_name.ilike.%${query.search}%`);
        }
        const { data: bookings, error, count } = await dbQuery;
        if (error) {
            throw new Error(`Failed to get bookings: ${error.message}`);
        }
        return {
            bookings: bookings.map(booking => this.formatAdminBookingResponse(booking)),
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil((count || 0) / limit),
            },
        };
    }
    async verifyPayment(bookingId, adminId) {
        const booking = await this.getBookingById(bookingId);
        if (booking.status !== 'AWAIT_SHOP_CONFIRM') {
            throw new errors_1.ConflictError('Booking is not awaiting payment confirmation');
        }
        const { error: paymentError } = await this.supabase
            .from('payments')
            .update({
            status: 'VERIFIED',
            paid_at: new Date().toISOString(),
            verification_notes: `Verified by admin ${adminId}`,
        })
            .eq('booking_id', bookingId);
        if (paymentError) {
            throw new Error(`Failed to update payment: ${paymentError.message}`);
        }
        const { error: bookingError } = await this.supabase
            .from('bookings')
            .update({
            status: 'CONFIRMED',
            admin_notes: `Payment verified by admin ${adminId}`,
        })
            .eq('id', bookingId);
        if (bookingError) {
            throw new Error(`Failed to update booking: ${bookingError.message}`);
        }
        try {
            const slotStart = time_1.TimeHelper.fromISO(booking.slot_start);
            await this.capacityService.confirmSlot(slotStart);
        }
        catch (capacityError) {
            console.error('Failed to confirm slot capacity:', capacityError.message);
        }
        await this.sendLineNotification(booking, 'CONFIRMED');
        return {
            success: true,
            message: 'Payment verified successfully',
        };
    }
    async rejectPayment(bookingId, reason, adminId) {
        const booking = await this.getBookingById(bookingId);
        if (booking.status !== 'AWAIT_SHOP_CONFIRM') {
            throw new errors_1.ConflictError('Booking is not awaiting payment confirmation');
        }
        const { error: paymentError } = await this.supabase
            .from('payments')
            .update({
            status: 'REJECTED',
            verification_notes: `Rejected by admin ${adminId}: ${reason}`,
        })
            .eq('booking_id', bookingId);
        if (paymentError) {
            throw new Error(`Failed to update payment: ${paymentError.message}`);
        }
        const { error: bookingError } = await this.supabase
            .from('bookings')
            .update({
            status: 'REJECTED',
            admin_notes: `Payment rejected by admin ${adminId}: ${reason}`,
        })
            .eq('id', bookingId);
        if (bookingError) {
            throw new Error(`Failed to update booking: ${bookingError.message}`);
        }
        try {
            const slotStart = time_1.TimeHelper.fromISO(booking.slot_start);
            await this.capacityService.releaseSlot(slotStart);
        }
        catch (capacityError) {
            console.error('Failed to release slot capacity:', capacityError.message);
        }
        await this.sendLineNotification(booking, 'REJECTED', reason);
        return {
            success: true,
            message: 'Payment rejected successfully',
        };
    }
    async assignRunner(bookingId, assignee, adminId) {
        const booking = await this.getBookingById(bookingId);
        if (booking.status !== 'CONFIRMED') {
            throw new errors_1.ConflictError('Only confirmed bookings can have runners assigned');
        }
        const { error: jobError } = await this.supabase
            .from('jobs')
            .upsert({
            booking_id: bookingId,
            assignee,
            phase: 'pickup',
            started_at: new Date().toISOString(),
            notes: `Assigned by admin ${adminId}`,
        }, {
            onConflict: 'booking_id',
        });
        if (jobError) {
            throw new Error(`Failed to create job assignment: ${jobError.message}`);
        }
        const { error: bookingError } = await this.supabase
            .from('bookings')
            .update({
            status: 'PICKUP_ASSIGNED',
            admin_notes: `Runner ${assignee} assigned by admin ${adminId}`,
        })
            .eq('id', bookingId);
        if (bookingError) {
            throw new Error(`Failed to update booking: ${bookingError.message}`);
        }
        await this.sendLineNotification(booking, 'PICKUP_ASSIGNED');
        return {
            success: true,
            message: `Runner ${assignee} assigned successfully`,
        };
    }
    async transitionBooking(bookingId, nextStatus, notes, adminId) {
        const booking = await this.getBookingById(bookingId);
        const currentStatus = booking.status;
        const allowedTransitions = this.STATUS_TRANSITIONS.get(currentStatus) || [];
        if (!allowedTransitions.includes(nextStatus)) {
            throw new errors_1.InvalidTransitionError(currentStatus, nextStatus);
        }
        const updateData = {
            status: nextStatus,
        };
        if (notes) {
            updateData.admin_notes = notes;
        }
        const { error: bookingError } = await this.supabase
            .from('bookings')
            .update(updateData)
            .eq('id', bookingId);
        if (bookingError) {
            throw new Error(`Failed to update booking: ${bookingError.message}`);
        }
        if (['PICKED_UP', 'IN_WASH', 'READY_FOR_RETURN', 'ON_THE_WAY_RETURN', 'COMPLETED'].includes(nextStatus)) {
            await this.updateJobPhase(bookingId, nextStatus, notes);
        }
        await this.sendLineNotification(booking, nextStatus);
        return {
            success: true,
            message: `Booking status updated to ${nextStatus}`,
        };
    }
    async getDashboardStats() {
        const today = time_1.TimeHelper.now().startOf('day');
        const todayStart = time_1.TimeHelper.toISO(today);
        const todayEnd = time_1.TimeHelper.toISO(today.endOf('day'));
        const [todayBookings, pendingPayments, activeJobs, completedToday] = await Promise.all([
            this.getBookingCount({
                startDate: todayStart,
                endDate: todayEnd
            }),
            this.getBookingCount({
                status: 'AWAIT_SHOP_CONFIRM'
            }),
            this.getBookingCount({
                status: ['PICKUP_ASSIGNED', 'PICKED_UP', 'IN_WASH', 'READY_FOR_RETURN', 'ON_THE_WAY_RETURN']
            }),
            this.getBookingCount({
                status: 'COMPLETED',
                startDate: todayStart,
                endDate: todayEnd
            }),
        ]);
        const weeklyStats = await this.getWeeklyStats();
        return {
            today: {
                bookings: todayBookings,
                pendingPayments,
                activeJobs,
                completed: completedToday,
            },
            weekly: weeklyStats,
        };
    }
    async getBookingById(bookingId) {
        const { data: booking, error } = await this.supabase
            .from('bookings')
            .select(`
        *,
        users(display_name, phone, line_user_id)
      `)
            .eq('id', bookingId)
            .single();
        if (error || !booking) {
            throw new errors_1.NotFoundError('Booking', bookingId);
        }
        return booking;
    }
    async getBookingCount(filters) {
        let query = this.supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true });
        if (filters.status) {
            if (Array.isArray(filters.status)) {
                query = query.in('status', filters.status);
            }
            else {
                query = query.eq('status', filters.status);
            }
        }
        if (filters.startDate && filters.endDate) {
            query = query.gte('slot_start', filters.startDate).lte('slot_start', filters.endDate);
        }
        const { count, error } = await query;
        if (error) {
            console.error('Failed to get booking count:', error);
            return 0;
        }
        return count || 0;
    }
    async getWeeklyStats() {
        const stats = [];
        const today = time_1.TimeHelper.now().startOf('day');
        for (let i = 6; i >= 0; i--) {
            const date = today.minus({ days: i });
            const startOfDay = time_1.TimeHelper.toISO(date);
            const endOfDay = time_1.TimeHelper.toISO(date.endOf('day'));
            const bookingCount = await this.getBookingCount({
                startDate: startOfDay,
                endDate: endOfDay,
            });
            stats.push({
                date: time_1.TimeHelper.toISODate(date),
                bookings: bookingCount,
            });
        }
        return stats;
    }
    async updateJobPhase(bookingId, status, notes) {
        const phaseMap = {
            'PICKED_UP': 'pickup',
            'IN_WASH': 'wash',
            'READY_FOR_RETURN': 'wash',
            'ON_THE_WAY_RETURN': 'return',
            'COMPLETED': 'return',
        };
        const phase = phaseMap[status];
        if (!phase)
            return;
        const updateData = {
            phase,
        };
        if (status === 'COMPLETED') {
            updateData.finished_at = new Date().toISOString();
        }
        if (notes) {
            updateData.notes = notes;
        }
        const { error } = await this.supabase
            .from('jobs')
            .update(updateData)
            .eq('booking_id', bookingId);
        if (error) {
            console.error('Failed to update job phase:', error);
        }
    }
    async sendLineNotification(booking, status, reason) {
        try {
            const user = booking.users || booking.user;
            if (!user?.line_user_id)
                return;
            let message;
            switch (status) {
                case 'CONFIRMED':
                    message = line_1.LineHelper.createBookingConfirmedMessage();
                    break;
                case 'REJECTED':
                    message = line_1.LineHelper.createPaymentRejectedMessage(reason || 'ไม่ระบุเหตุผล');
                    break;
                default:
                    const statusText = this.STATUS_MESSAGES.get(status);
                    if (statusText) {
                        message = line_1.LineHelper.createStatusUpdateMessage(status, statusText);
                    }
                    break;
            }
            if (message) {
                await line_1.LineHelper.pushMessage(user.line_user_id, [message]);
            }
        }
        catch (error) {
            console.error('Failed to send LINE notification:', error.message);
        }
    }
    formatAdminBookingResponse(booking) {
        const pickup = this.parseGeographyToCoords(booking.pickup_point);
        const dropoff = this.parseGeographyToCoords(booking.dropoff_point);
        return {
            id: booking.id,
            user: {
                displayName: booking.users?.display_name,
                phone: booking.users?.phone,
                lineUserId: booking.users?.line_user_id,
            },
            services: booking.services,
            pickup,
            dropoff: booking.same_point ? pickup : dropoff,
            samePoint: booking.same_point,
            slotStart: booking.slot_start,
            slotEnd: booking.slot_end,
            status: booking.status,
            priceEstimate: booking.price_estimate,
            depositMinor: booking.deposit_minor,
            notes: booking.notes,
            adminNotes: booking.admin_notes,
            holdExpiresAt: booking.hold_expires_at,
            createdAt: booking.created_at,
            updatedAt: booking.updated_at,
            payments: booking.payments || [],
            jobs: booking.jobs || [],
            reviews: booking.reviews || [],
        };
    }
    parseGeographyToCoords(geography) {
        if (typeof geography === 'string') {
            const match = geography.match(/POINT\(([^)]+)\)/);
            if (match) {
                const [lng, lat] = match[1].split(' ').map(Number);
                return { lat, lng };
            }
        }
        return { lat: 0, lng: 0 };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [capacity_service_1.CapacityService])
], AdminService);
//# sourceMappingURL=admin.service.js.map