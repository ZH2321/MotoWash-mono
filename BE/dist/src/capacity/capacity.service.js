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
exports.CapacityService = void 0;
const common_1 = require("@nestjs/common");
const luxon_1 = require("luxon");
const supabase_1 = require("../db/supabase");
const settings_service_1 = require("../settings/settings.service");
const time_1 = require("../common/time");
const config_1 = require("../common/config");
const errors_1 = require("../common/errors");
let CapacityService = class CapacityService {
    constructor(settingsService) {
        this.settingsService = settingsService;
        this.supabase = supabase_1.supabaseService;
    }
    async getAvailability(date, endDate) {
        const startDate = luxon_1.DateTime.fromISO(date).setZone(config_1.config.TZ);
        const finalDate = endDate ? luxon_1.DateTime.fromISO(endDate).setZone(config_1.config.TZ) : startDate;
        if (!startDate.isValid || !finalDate.isValid) {
            throw new errors_1.ValidationError('Invalid date format');
        }
        if (startDate > finalDate) {
            throw new errors_1.ValidationError('Start date must be before or equal to end date');
        }
        if (finalDate.diff(startDate, 'days').days > 30) {
            throw new errors_1.ValidationError('Date range cannot exceed 30 days');
        }
        const results = [];
        let currentDate = startDate;
        while (currentDate <= finalDate) {
            const dayAvailability = await this.getDayAvailability(currentDate);
            results.push(dayAvailability);
            currentDate = currentDate.plus({ days: 1 });
        }
        return results;
    }
    async getDayAvailability(date) {
        const weekday = time_1.TimeHelper.getWeekday(date);
        const businessHours = await this.getBusinessHoursForDay(weekday);
        if (!businessHours) {
            return {
                date: time_1.TimeHelper.toISODate(date),
                business: {
                    open: '00:00',
                    close: '00:00',
                    slotMinutes: config_1.config.BOOKING_TIMEBLOCK_MINUTES,
                },
                dayBookable: false,
                slots: [],
            };
        }
        const dayBookable = this.isDayBookable(date, businessHours.closeTime);
        const slots = await this.generateSlotsForDay(date, businessHours, dayBookable);
        return {
            date: time_1.TimeHelper.toISODate(date),
            business: {
                open: businessHours.openTime,
                close: businessHours.closeTime,
                slotMinutes: businessHours.slotMinutes,
            },
            dayBookable,
            slots,
        };
    }
    async getBusinessHoursForDay(weekday) {
        const { data, error } = await this.supabase
            .from('business_hours')
            .select('*')
            .eq('weekday', weekday)
            .eq('is_active', true)
            .single();
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to get business hours: ${error.message}`);
        }
        return data ? {
            openTime: data.open_time,
            closeTime: data.close_time,
            slotMinutes: data.slot_minutes,
            defaultQuota: data.default_quota,
        } : null;
    }
    isDayBookable(date, closeTime) {
        const now = time_1.TimeHelper.now();
        if (time_1.TimeHelper.isSameDay(date, now)) {
            const closingTime = date.startOf('day').set({
                hour: parseInt(closeTime.split(':')[0]),
                minute: parseInt(closeTime.split(':')[1]),
            });
            if (time_1.TimeHelper.isAfter(now, closingTime)) {
                return false;
            }
        }
        return true;
    }
    async generateSlotsForDay(date, businessHours, dayBookable) {
        const slots = time_1.TimeHelper.generateTimeSlots(time_1.TimeHelper.toISODate(date), businessHours.openTime, businessHours.closeTime, businessHours.slotMinutes);
        const slotAvailabilities = [];
        for (const slotTime of slots) {
            const availability = await this.getSlotAvailability(slotTime, businessHours.defaultQuota, dayBookable);
            slotAvailabilities.push(availability);
        }
        return slotAvailabilities;
    }
    async getSlotAvailability(slotTime, defaultQuota, dayBookable) {
        const { data: counter, error } = await this.supabase
            .from('capacity_counters')
            .select('*')
            .eq('slot_start', time_1.TimeHelper.toISO(slotTime))
            .single();
        let quota = defaultQuota;
        let reserved = 0;
        let confirmed = 0;
        if (!error && counter) {
            quota = counter.quota;
            reserved = counter.reserved_count;
            confirmed = counter.confirmed_count;
        }
        const override = await this.getSlotOverride(slotTime);
        if (override) {
            if (override.closed) {
                return {
                    start: time_1.TimeHelper.toISO(slotTime),
                    quota,
                    reserved,
                    confirmed,
                    bookable: false,
                    reason: override.reason || 'Slot is closed',
                };
            }
            if (override.quota !== null) {
                quota = override.quota;
            }
        }
        let bookable = dayBookable;
        let reason;
        if (!dayBookable) {
            reason = 'Day is not bookable';
        }
        else if (reserved >= quota) {
            bookable = false;
            reason = 'Slot is full';
        }
        else {
            const cutoffCheck = time_1.TimeHelper.isCurrentDayBookable(slotTime, '18:00:00', config_1.config.CUT_OFF_MINUTES_TODAY);
            if (!cutoffCheck.bookable) {
                bookable = false;
                reason = cutoffCheck.reason;
            }
        }
        return {
            start: time_1.TimeHelper.toISO(slotTime),
            quota,
            reserved,
            confirmed,
            bookable,
            reason,
        };
    }
    async getSlotOverride(slotTime) {
        const { data, error } = await this.supabase
            .from('slot_overrides')
            .select('*')
            .eq('date', time_1.TimeHelper.toISODate(slotTime))
            .eq('slot_start', time_1.TimeHelper.toISO(slotTime))
            .single();
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to get slot override: ${error.message}`);
        }
        return data;
    }
    async reserveSlot(slotStart) {
        const { data, error } = await this.supabase.rpc('fn_reserve_slot', {
            p_slot_start: time_1.TimeHelper.toISO(slotStart),
        });
        if (error) {
            console.error('Reserve slot error:', error);
            return false;
        }
        return data === true;
    }
    async releaseSlot(slotStart) {
        const { error } = await this.supabase.rpc('fn_release_slot', {
            p_slot_start: time_1.TimeHelper.toISO(slotStart),
        });
        if (error) {
            console.error('Release slot error:', error);
            throw new Error(`Failed to release slot: ${error.message}`);
        }
    }
    async confirmSlot(slotStart) {
        const { error } = await this.supabase.rpc('fn_confirm_slot', {
            p_slot_start: time_1.TimeHelper.toISO(slotStart),
        });
        if (error) {
            console.error('Confirm slot error:', error);
            throw new Error(`Failed to confirm slot: ${error.message}`);
        }
    }
};
exports.CapacityService = CapacityService;
exports.CapacityService = CapacityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], CapacityService);
//# sourceMappingURL=capacity.service.js.map