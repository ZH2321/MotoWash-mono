import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';
import { supabaseService } from '../db/supabase';
import { CapacityService } from '../capacity/capacity.service';
import { TimeHelper } from '../common/time';
import { LineHelper } from '../common/line';
import { DB_READY } from '../db/supabase';

interface RawBookingDataFromSupabase {
  id: string;
  slot_start: string;
  user_id: string;
  users?: {
    line_user_id?: string;
  };
}

interface ExpiredBooking {
  id: string;
  slot_start: string;
  user_id: string;
  line_user_id?: string;
}

@Injectable()
export class TtlService {
  private readonly logger = new Logger(TtlService.name);
  private readonly supabase: SupabaseClient;

  constructor(private readonly capacityService: CapacityService) {
    this.supabase = supabaseService;
  }


  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredHolds(): Promise<void> {
    if (!DB_READY) return; // กันยิงตอน DB ยังไม่พร้อม;

    try {
      const expiredBookings = await this.findAndExpireHolds();
      
      if (expiredBookings.length > 0) {
        this.logger.log(`Found ${expiredBookings.length} expired holds`);
        
        // Release capacity for expired bookings
        await this.releaseExpiredCapacity(expiredBookings);
        
        // Optionally send LINE notifications
        // await this.notifyExpiredBookings(expiredBookings);
        
        this.logger.log(`Successfully processed ${expiredBookings.length} expired holds`);
      }
    } catch (error) {
      this.logger.error('Failed to process expired holds:', error.message);
    }
  }

  private async findAndExpireHolds(): Promise<ExpiredBooking[]> {
    const now = TimeHelper.now();
    
    // Find expired holds
    const { data: rawBookings, error } = await this.supabase
      .from('bookings')
      .select(`
        id,
        slot_start,
        user_id,
        users!inner(line_user_id)
      `)
      .eq('status', 'HOLD_PENDING_PAYMENT')
      .lt('hold_expires_at', TimeHelper.toISO(now));

    if (error) {
      throw new Error(`Failed to find expired holds: ${error.message}`);
    }

    if (!rawBookings || rawBookings.length === 0) {
      return [];
    }

    const expiredBookings = rawBookings as RawBookingDataFromSupabase[];

    // Update bookings to expired status
    const bookingIds = expiredBookings.map(b => b.id);
    const { error: updateError } = await this.supabase
      .from('bookings')
      .update({ 
        status: 'HOLD_EXPIRED',
        updated_at: TimeHelper.toISO(now),
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

  private async releaseExpiredCapacity(expiredBookings: ExpiredBooking[]): Promise<void> {
    const uniqueSlots = [...new Set(expiredBookings.map(b => b.slot_start))];
    
    for (const slotStart of uniqueSlots) {
      try {
        const slotDateTime = TimeHelper.fromISO(slotStart);
        await this.capacityService.releaseSlot(slotDateTime);
        this.logger.debug(`Released capacity for slot: ${slotStart}`);
      } catch (error) {
        this.logger.error(`Failed to release capacity for slot ${slotStart}:`, error.message);
      }
    }
  }

  private async notifyExpiredBookings(expiredBookings: ExpiredBooking[]): Promise<void> {
    for (const booking of expiredBookings) {
      if (booking.line_user_id) {
        try {
          const message = LineHelper.createBookingExpiredMessage();
          await LineHelper.pushMessage(booking.line_user_id, [message]);
          this.logger.debug(`Sent expiration notification to user: ${booking.line_user_id}`);
        } catch (error) {
          this.logger.error(`Failed to send expiration notification:`, error.message);
        }
      }
    }
  }

  // Additional cron job to clean up old completed bookings (optional)
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldBookings(): Promise<void> {
    this.logger.log('Running old bookings cleanup...');

    try {
      const thirtyDaysAgo = TimeHelper.addMinutes(TimeHelper.now(), -30 * 24 * 60);
      
      const { count, error } = await this.supabase
        .from('bookings')
        .delete()
        .in('status', ['COMPLETED', 'REVIEWED', 'CANCELLED', 'NO_SHOW'])
        .lt('updated_at', TimeHelper.toISO(thirtyDaysAgo));

      if (error) {
        throw new Error(`Failed to cleanup old bookings: ${error.message}`);
      }

      if (count && count > 0) {
        this.logger.log(`Cleaned up ${count} old bookings`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old bookings:', error.message);
    }
  }

  // Cron job to generate capacity counters for upcoming days
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async generateUpcomingCapacity(): Promise<void> {
    this.logger.log('Generating capacity counters for upcoming days...');

    try {
      // Generate capacity for next 7 days
      for (let i = 0; i < 7; i++) {
        const date = TimeHelper.addMinutes(TimeHelper.now(), i * 24 * 60);
        await this.generateCapacityForDate(date);
      }
      
      this.logger.log('Successfully generated capacity counters');
    } catch (error) {
      this.logger.error('Failed to generate capacity counters:', error.message);
    }
  }

  private async generateCapacityForDate(date: DateTime): Promise<void> {
    const weekday = TimeHelper.getWeekday(date);
    
    // Get business hours for this day
    const { data: businessHours, error } = await this.supabase
      .from('business_hours')
      .select('*')
      .eq('weekday', weekday)
      .eq('is_active', true)
      .single();

    if (error || !businessHours) {
      return; // No business hours configured for this day
    }

    // Generate time slots
    const slots = TimeHelper.generateTimeSlots(
      TimeHelper.toISODate(date),
      businessHours.open_time,
      businessHours.close_time,
      businessHours.slot_minutes
    );

    // Create capacity counters for each slot if not exists
    for (const slot of slots) {
      const { error: upsertError } = await this.supabase
        .from('capacity_counters')
        .upsert({
          date: TimeHelper.toISODate(slot),
          slot_start: TimeHelper.toISO(slot),
          quota: businessHours.default_quota,
          reserved_count: 0,
          confirmed_count: 0,
        }, {
          onConflict: 'date,slot_start',
          ignoreDuplicates: true,
        });

      if (upsertError) {
        this.logger.error(`Failed to create capacity counter for ${TimeHelper.toISO(slot)}:`, upsertError.message);
      }
    }
  }
}