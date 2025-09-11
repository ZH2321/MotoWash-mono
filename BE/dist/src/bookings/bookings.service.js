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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../db/supabase");
const capacity_service_1 = require("../capacity/capacity.service");
const settings_service_1 = require("../settings/settings.service");
const time_1 = require("../common/time");
const storage_1 = require("../common/storage");
const line_1 = require("../common/line");
const config_1 = require("../common/config");
const errors_1 = require("../common/errors");
let BookingsService = class BookingsService {
    constructor(capacityService, settingsService) {
        this.capacityService = capacityService;
        this.settingsService = settingsService;
        this.supabase = supabase_1.supabaseService;
    }
    async createHold(userId, data) {
        const slotStart = time_1.TimeHelper.fromISO(data.slotStart);
        await this.validateSlotTiming(slotStart);
        await this.validateServiceArea(data.pickup);
        if (data.dropoff && !data.samePoint) {
            await this.validateServiceArea(data.dropoff);
        }
        const { data: booking, error: bookingError } = await this.supabase
            .from('bookings')
            .insert({
            user_id: userId,
            services: data.services,
            pickup_point: `SRID=4326;POINT(${data.pickup.lng} ${data.pickup.lat})`,
            dropoff_point: data.dropoff && !data.samePoint
                ? `SRID=4326;POINT(${data.dropoff.lng} ${data.dropoff.lat})`
                : `SRID=4326;POINT(${data.pickup.lng} ${data.pickup.lat})`,
            same_point: data.samePoint,
            slot_start: time_1.TimeHelper.toISO(slotStart),
            slot_end: time_1.TimeHelper.toISO(time_1.TimeHelper.addMinutes(slotStart, config_1.config.BOOKING_TIMEBLOCK_MINUTES)),
            status: 'HOLD_PENDING_PAYMENT',
            price_estimate: data.priceEstimate,
            deposit_minor: 2000,
            notes: data.notes,
            hold_expires_at: time_1.TimeHelper.toISO(time_1.TimeHelper.addMinutes(time_1.TimeHelper.now(), config_1.config.HOLD_TTL_MINUTES)),
        })
            .select()
            .single();
        if (bookingError) {
            throw new Error(`Failed to create booking: ${bookingError.message}`);
        }
        const reserved = await this.capacityService.reserveSlot(slotStart);
        if (!reserved) {
            await this.supabase.from('bookings').delete().eq('id', booking.id);
            throw new errors_1.SlotUnavailableError(time_1.TimeHelper.toISO(slotStart));
        }
        const { error: paymentError } = await this.supabase
            .from('payments')
            .insert({
            booking_id: booking.id,
            method: 'bank_transfer',
            amount_minor: 2000,
            status: 'PENDING',
        });
        if (paymentError) {
            await this.capacityService.releaseSlot(slotStart);
            await this.supabase.from('bookings').delete().eq('id', booking.id);
            throw new Error(`Failed to create payment: ${paymentError.message}`);
        }
        const paymentChannels = await this.settingsService.getPaymentChannels();
        const payInfo = this.buildPaymentInfo(paymentChannels);
        try {
            const user = await this.getUser(userId);
            if (user.line_user_id) {
                const message = line_1.LineHelper.createBookingHoldMessage(booking.id, time_1.TimeHelper.formatThaiDateTime(slotStart), time_1.TimeHelper.formatThaiDateTime(time_1.TimeHelper.fromISO(booking.hold_expires_at)));
                await line_1.LineHelper.pushMessage(user.line_user_id, [message]);
            }
        }
        catch (lineError) {
            console.error('Failed to send LINE notification:', lineError.message);
        }
        return {
            bookingId: booking.id,
            holdExpiresAt: booking.hold_expires_at,
            payInfo: {
                ...payInfo,
                depositAmount: 20,
            },
        };
    }
    async uploadPaymentSlip(userId, bookingId, file) {
        const validation = storage_1.StorageHelper.validateImageFile(file);
        if (!validation.isValid) {
            throw new errors_1.ValidationError(validation.error);
        }
        const booking = await this.getBookingByIdAndUser(bookingId, userId);
        if (booking.status !== 'HOLD_PENDING_PAYMENT') {
            throw new errors_1.ConflictError('Booking is not in pending payment state');
        }
        if (time_1.TimeHelper.isAfter(time_1.TimeHelper.now(), time_1.TimeHelper.fromISO(booking.hold_expires_at))) {
            throw new errors_1.HoldExpiredError();
        }
        const filePath = storage_1.StorageHelper.generateFilePath('slips', file.filename);
        const uploadPath = await storage_1.StorageHelper.uploadFile('slips', filePath, file.buffer, file.mimetype);
        const { error: paymentError } = await this.supabase
            .from('payments')
            .update({
            slip_url: uploadPath,
            status: 'UNDER_REVIEW',
        })
            .eq('booking_id', bookingId);
        if (paymentError) {
            throw new Error(`Failed to update payment: ${paymentError.message}`);
        }
        const { error: bookingError } = await this.supabase
            .from('bookings')
            .update({
            status: 'AWAIT_SHOP_CONFIRM',
        })
            .eq('id', bookingId);
        if (bookingError) {
            throw new Error(`Failed to update booking: ${bookingError.message}`);
        }
        try {
            const user = await this.getUser(userId);
            if (user.line_user_id) {
                const message = line_1.LineHelper.createPaymentPendingMessage();
                await line_1.LineHelper.pushMessage(user.line_user_id, [message]);
            }
        }
        catch (lineError) {
            console.error('Failed to send LINE notification:', lineError.message);
        }
        return {
            success: true,
            message: 'Payment slip uploaded successfully',
            slipUrl: `${config_1.config.RECEIPT_BASE_URL}/${uploadPath}`,
        };
    }
    async cancelHold(userId, bookingId) {
        const booking = await this.getBookingByIdAndUser(bookingId, userId);
        if (booking.status !== 'HOLD_PENDING_PAYMENT') {
            throw new errors_1.ConflictError('Only pending payment bookings can be cancelled');
        }
        const { error: updateError } = await this.supabase
            .from('bookings')
            .update({ status: 'CANCELLED' })
            .eq('id', bookingId);
        if (updateError) {
            throw new Error(`Failed to cancel booking: ${updateError.message}`);
        }
        try {
            const slotStart = time_1.TimeHelper.fromISO(booking.slot_start);
            await this.capacityService.releaseSlot(slotStart);
        }
        catch (releaseError) {
            console.error('Failed to release slot capacity:', releaseError.message);
        }
        return {
            success: true,
            message: 'Booking cancelled successfully',
        };
    }
    async getBooking(bookingId, user) {
        let query = this.supabase
            .from('bookings')
            .select(`
        *,
        payments(*),
        jobs(*),
        reviews(*)
      `)
            .eq('id', bookingId);
        if (user.role !== 'admin') {
            query = query.eq('user_id', user.id);
        }
        const { data: booking, error } = await query.single();
        if (error || !booking) {
            throw new errors_1.NotFoundError('Booking', bookingId);
        }
        return this.formatBookingResponse(booking);
    }
    async getUserBookings(userId) {
        const { data: bookings, error } = await this.supabase
            .from('bookings')
            .select(`
        *,
        payments(*),
        jobs(*),
        reviews(*)
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to get user bookings: ${error.message}`);
        }
        return bookings.map(booking => this.formatBookingResponse(booking));
    }
    async validateSlotTiming(slotStart) {
        const now = time_1.TimeHelper.now();
        if (time_1.TimeHelper.isBefore(slotStart, now)) {
            throw new errors_1.ValidationError('Cannot book slots in the past');
        }
        const maxFutureDate = time_1.TimeHelper.addMinutes(now, 30 * 24 * 60);
        if (time_1.TimeHelper.isAfter(slotStart, maxFutureDate)) {
            throw new errors_1.ValidationError('Cannot book slots more than 30 days in advance');
        }
        if (time_1.TimeHelper.isSameDay(slotStart, now)) {
            const cutoffCheck = time_1.TimeHelper.isCurrentDayBookable(slotStart, '18:00:00', config_1.config.CUT_OFF_MINUTES_TODAY);
            if (!cutoffCheck.bookable) {
                throw new errors_1.ValidationError(cutoffCheck.reason);
            }
        }
    }
    async validateServiceArea(coordinates) {
        const { data: isValid, error } = await this.supabase.rpc('fn_validate_point_in_service_area', {
            lat: coordinates.lat,
            lng: coordinates.lng,
        });
        if (error) {
            throw new Error(`Service area validation failed: ${error.message}`);
        }
        if (!isValid) {
            throw new errors_1.ServiceAreaError('Location is outside service area');
        }
    }
    async getUser(userId) {
        const { data: user, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        if (error || !user) {
            throw new errors_1.NotFoundError('User', userId);
        }
        return user;
    }
    async getBookingByIdAndUser(bookingId, userId) {
        const { data: booking, error } = await this.supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .eq('user_id', userId)
            .single();
        if (error || !booking) {
            throw new errors_1.NotFoundError('Booking', bookingId);
        }
        return booking;
    }
    buildPaymentInfo(channels) {
        const info = {};
        for (const channel of channels) {
            switch (channel.type) {
                case 'promptpay':
                    info.promptpayId = channel.value;
                    break;
                case 'bank_account':
                    info.bankAccount = channel.value;
                    break;
                case 'qr_code':
                    info.qrUrl = `${config_1.config.RECEIPT_BASE_URL}/${channel.value}`;
                    break;
            }
        }
        return info;
    }
    formatBookingResponse(booking) {
        const pickup = this.parseGeographyToCoords(booking.pickup_point);
        const dropoff = this.parseGeographyToCoords(booking.dropoff_point);
        return {
            id: booking.id,
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
            holdExpiresAt: booking.hold_expires_at,
            adminNotes: booking.admin_notes,
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
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [capacity_service_1.CapacityService,
        settings_service_1.SettingsService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map