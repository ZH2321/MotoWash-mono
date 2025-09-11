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
var TtlService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TtlService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const supabase_1 = require("../db/supabase");
const capacity_service_1 = require("../capacity/capacity.service");
const time_1 = require("../common/time");
const line_1 = require("../common/line");
const supabase_2 = require("../db/supabase");
let TtlService = TtlService_1 = class TtlService {
    constructor(capacityService) {
        this.capacityService = capacityService;
        this.logger = new common_1.Logger(TtlService_1.name);
        this.supabase = supabase_1.supabaseService;
    }
    async handleExpiredHolds() {
        if (!supabase_2.DB_READY)
            return;
        try {
            const expiredBookings = await this.findAndExpireHolds();
            if (expiredBookings.length > 0) {
                this.logger.log(`Found ${expiredBookings.length} expired holds`);
                await this.releaseExpiredCapacity(expiredBookings);
                this.logger.log(`Successfully processed ${expiredBookings.length} expired holds`);
            }
        }
        catch (error) {
            this.logger.error('Failed to process expired holds:', error.message);
        }
    }
    async findAndExpireHolds() {
        const now = time_1.TimeHelper.now();
        const { data: rawBookings, error } = await this.supabase
            .from('bookings')
            .select(`
        id,
        slot_start,
        user_id,
        users!inner(line_user_id)
      `)
            .eq('status', 'HOLD_PENDING_PAYMENT')
            .lt('hold_expires_at', time_1.TimeHelper.toISO(now));
        if (error) {
            throw new Error(`Failed to find expired holds: ${error.message}`);
        }
        if (!rawBookings || rawBookings.length === 0) {
            return [];
        }
        const expiredBookings = rawBookings;
        const bookingIds = expiredBookings.map(b => b.id);
        const { error: updateError } = await this.supabase
            .from('bookings')
            .update({
            status: 'HOLD_EXPIRED',
            updated_at: time_1.TimeHelper.toISO(now),
        })
            .in('id', bookingIds);
        if (updateError) {
            throw new Error(`Failed to update expired bookings: ${updateError.message}`);
        }
        return expiredBookings.map(booking => ({
            id: booking.id,
            slot_start: booking.slot_start,
            user_id: booking.user_id,
            line_user_id: booking.users?.line_user_id,
        }));
    }
    async releaseExpiredCapacity(expiredBookings) {
        const uniqueSlots = [...new Set(expiredBookings.map(b => b.slot_start))];
        for (const slotStart of uniqueSlots) {
            try {
                const slotDateTime = time_1.TimeHelper.fromISO(slotStart);
                await this.capacityService.releaseSlot(slotDateTime);
                this.logger.debug(`Released capacity for slot: ${slotStart}`);
            }
            catch (error) {
                this.logger.error(`Failed to release capacity for slot ${slotStart}:`, error.message);
            }
        }
    }
    async notifyExpiredBookings(expiredBookings) {
        for (const booking of expiredBookings) {
            if (booking.line_user_id) {
                try {
                    const message = line_1.LineHelper.createBookingExpiredMessage();
                    await line_1.LineHelper.pushMessage(booking.line_user_id, [message]);
                    this.logger.debug(`Sent expiration notification to user: ${booking.line_user_id}`);
                }
                catch (error) {
                    this.logger.error(`Failed to send expiration notification:`, error.message);
                }
            }
        }
    }
    async cleanupOldBookings() {
        this.logger.log('Running old bookings cleanup...');
        try {
            const thirtyDaysAgo = time_1.TimeHelper.addMinutes(time_1.TimeHelper.now(), -30 * 24 * 60);
            const { count, error } = await this.supabase
                .from('bookings')
                .delete()
                .in('status', ['COMPLETED', 'REVIEWED', 'CANCELLED', 'NO_SHOW'])
                .lt('updated_at', time_1.TimeHelper.toISO(thirtyDaysAgo));
            if (error) {
                throw new Error(`Failed to cleanup old bookings: ${error.message}`);
            }
            if (count && count > 0) {
                this.logger.log(`Cleaned up ${count} old bookings`);
            }
        }
        catch (error) {
            this.logger.error('Failed to cleanup old bookings:', error.message);
        }
    }
    async generateUpcomingCapacity() {
        this.logger.log('Generating capacity counters for upcoming days...');
        try {
            for (let i = 0; i < 7; i++) {
                const date = time_1.TimeHelper.addMinutes(time_1.TimeHelper.now(), i * 24 * 60);
                await this.generateCapacityForDate(date);
            }
            this.logger.log('Successfully generated capacity counters');
        }
        catch (error) {
            this.logger.error('Failed to generate capacity counters:', error.message);
        }
    }
    async generateCapacityForDate(date) {
        const weekday = time_1.TimeHelper.getWeekday(date);
        const { data: businessHours, error } = await this.supabase
            .from('business_hours')
            .select('*')
            .eq('weekday', weekday)
            .eq('is_active', true)
            .single();
        if (error || !businessHours) {
            return;
        }
        const slots = time_1.TimeHelper.generateTimeSlots(time_1.TimeHelper.toISODate(date), businessHours.open_time, businessHours.close_time, businessHours.slot_minutes);
        for (const slot of slots) {
            const { error: upsertError } = await this.supabase
                .from('capacity_counters')
                .upsert({
                date: time_1.TimeHelper.toISODate(slot),
                slot_start: time_1.TimeHelper.toISO(slot),
                quota: businessHours.default_quota,
                reserved_count: 0,
                confirmed_count: 0,
            }, {
                onConflict: 'date,slot_start',
                ignoreDuplicates: true,
            });
            if (upsertError) {
                this.logger.error(`Failed to create capacity counter for ${time_1.TimeHelper.toISO(slot)}:`, upsertError.message);
            }
        }
    }
};
exports.TtlService = TtlService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TtlService.prototype, "handleExpiredHolds", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TtlService.prototype, "cleanupOldBookings", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_1AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TtlService.prototype, "generateUpcomingCapacity", null);
exports.TtlService = TtlService = TtlService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [capacity_service_1.CapacityService])
], TtlService);
//# sourceMappingURL=ttl.service.js.map