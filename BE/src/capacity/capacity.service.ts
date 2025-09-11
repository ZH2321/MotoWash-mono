import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';
import { supabaseService } from '../db/supabase';
import { SettingsService } from '../settings/settings.service';
import { TimeHelper } from '../common/time';
import { config } from '../common/config';
import { ValidationError } from '../common/errors';

interface SlotAvailability {
  start: string;
  quota: number;
  reserved: number;
  confirmed: number;
  bookable: boolean;
  reason?: string;
}

export interface DayAvailability {
  date: string;
  business: {
    open: string;
    close: string;
    slotMinutes: number;
  };
  dayBookable: boolean;
  slots: SlotAvailability[];
}

@Injectable()
export class CapacityService {
  private readonly supabase: SupabaseClient;

  constructor(private readonly settingsService: SettingsService) {
    this.supabase = supabaseService;
  }

  async getAvailability(date: string, endDate?: string): Promise<DayAvailability[]> {
    const startDate = DateTime.fromISO(date).setZone(config.TZ);
    const finalDate = endDate ? DateTime.fromISO(endDate).setZone(config.TZ) : startDate;

    if (!startDate.isValid || !finalDate.isValid) {
      throw new ValidationError('Invalid date format');
    }

    if (startDate > finalDate) {
      throw new ValidationError('Start date must be before or equal to end date');
    }

    if (finalDate.diff(startDate, 'days').days > 30) {
      throw new ValidationError('Date range cannot exceed 30 days');
    }

    const results: DayAvailability[] = [];
    let currentDate = startDate;

    while (currentDate <= finalDate) {
      const dayAvailability = await this.getDayAvailability(currentDate);
      results.push(dayAvailability);
      currentDate = currentDate.plus({ days: 1 });
    }

    return results;
  }

  private async getDayAvailability(date: DateTime): Promise<DayAvailability> {
    const weekday = TimeHelper.getWeekday(date);
    
    // Get business hours for this day
    const businessHours = await this.getBusinessHoursForDay(weekday);
    
    if (!businessHours) {
      return {
        date: TimeHelper.toISODate(date),
        business: {
          open: '00:00',
          close: '00:00',
          slotMinutes: config.BOOKING_TIMEBLOCK_MINUTES,
        },
        dayBookable: false,
        slots: [],
      };
    }

    // Check if day is bookable
    const dayBookable = this.isDayBookable(date, businessHours.closeTime);

    // Generate time slots
    const slots = await this.generateSlotsForDay(date, businessHours, dayBookable);

    return {
      date: TimeHelper.toISODate(date),
      business: {
        open: businessHours.openTime,
        close: businessHours.closeTime,
        slotMinutes: businessHours.slotMinutes,
      },
      dayBookable,
      slots,
    };
  }

  private async getBusinessHoursForDay(weekday: number): Promise<any> {
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

  private isDayBookable(date: DateTime, closeTime: string): boolean {
    const now = TimeHelper.now();
    
    // Only check cutoff for current day
    if (TimeHelper.isSameDay(date, now)) {
      // Check if past business closing time
      const closingTime = date.startOf('day').set({
        hour: parseInt(closeTime.split(':')[0]),
        minute: parseInt(closeTime.split(':')[1]),
      });

      if (TimeHelper.isAfter(now, closingTime)) {
        return false;
      }
    }

    return true;
  }

  private async generateSlotsForDay(
    date: DateTime, 
    businessHours: any, 
    dayBookable: boolean
  ): Promise<SlotAvailability[]> {
    const slots = TimeHelper.generateTimeSlots(
      TimeHelper.toISODate(date),
      businessHours.openTime,
      businessHours.closeTime,
      businessHours.slotMinutes
    );

    const slotAvailabilities: SlotAvailability[] = [];

    for (const slotTime of slots) {
      const availability = await this.getSlotAvailability(slotTime, businessHours.defaultQuota, dayBookable);
      slotAvailabilities.push(availability);
    }

    return slotAvailabilities;
  }

  private async getSlotAvailability(
    slotTime: DateTime, 
    defaultQuota: number, 
    dayBookable: boolean
  ): Promise<SlotAvailability> {
    // Get capacity counter for this slot
    const { data: counter, error } = await this.supabase
      .from('capacity_counters')
      .select('*')
      .eq('slot_start', TimeHelper.toISO(slotTime))
      .single();

    let quota = defaultQuota;
    let reserved = 0;
    let confirmed = 0;

    if (!error && counter) {
      quota = counter.quota;
      reserved = counter.reserved_count;
      confirmed = counter.confirmed_count;
    }

    // Check for slot overrides
    const override = await this.getSlotOverride(slotTime);
    if (override) {
      if (override.closed) {
        return {
          start: TimeHelper.toISO(slotTime),
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

    // Determine if slot is bookable
    let bookable = dayBookable;
    let reason: string | undefined;

    if (!dayBookable) {
      reason = 'Day is not bookable';
    } else if (reserved >= quota) {
      bookable = false;
      reason = 'Slot is full';
    } else {
      // Check current day cutoff
      const cutoffCheck = TimeHelper.isCurrentDayBookable(
        slotTime,
        '18:00:00', // This should come from business hours
        config.CUT_OFF_MINUTES_TODAY
      );
      
      if (!cutoffCheck.bookable) {
        bookable = false;
        reason = cutoffCheck.reason;
      }
    }

    return {
      start: TimeHelper.toISO(slotTime),
      quota,
      reserved,
      confirmed,
      bookable,
      reason,
    };
  }

  private async getSlotOverride(slotTime: DateTime): Promise<any> {
    const { data, error } = await this.supabase
      .from('slot_overrides')
      .select('*')
      .eq('date', TimeHelper.toISODate(slotTime))
      .eq('slot_start', TimeHelper.toISO(slotTime))
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get slot override: ${error.message}`);
    }

    return data;
  }

  async reserveSlot(slotStart: DateTime): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('fn_reserve_slot', {
      p_slot_start: TimeHelper.toISO(slotStart),
    });

    if (error) {
      console.error('Reserve slot error:', error);
      return false;
    }

    return data === true;
  }

  async releaseSlot(slotStart: DateTime): Promise<void> {
    const { error } = await this.supabase.rpc('fn_release_slot', {
      p_slot_start: TimeHelper.toISO(slotStart),
    });

    if (error) {
      console.error('Release slot error:', error);
      throw new Error(`Failed to release slot: ${error.message}`);
    }
  }

  async confirmSlot(slotStart: DateTime): Promise<void> {
    const { error } = await this.supabase.rpc('fn_confirm_slot', {
      p_slot_start: TimeHelper.toISO(slotStart),
    });

    if (error) {
      console.error('Confirm slot error:', error);
      throw new Error(`Failed to confirm slot: ${error.message}`);
    }
  }
}