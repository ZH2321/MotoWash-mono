import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';
import { supabaseService } from '../db/supabase';
import { CapacityService } from '../capacity/capacity.service';
import { SettingsService } from '../settings/settings.service';
import { TimeHelper } from '../common/time';
import { StorageHelper } from '../common/storage';
import { LineHelper } from '../common/line';
import { config } from '../common/config';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError, 
  SlotUnavailableError,
  HoldExpiredError,
  ServiceAreaError,
  ForbiddenError,
} from '../common/errors';
import { AuthUser } from '../common/auth.guard';

interface CreateHoldData {
  services: string[];
  pickup: { lat: number; lng: number };
  dropoff?: { lat: number; lng: number };
  samePoint: boolean;
  slotStart: string;
  priceEstimate: number;
  notes?: string;
}

export interface HoldResult {
  bookingId: string;
  holdExpiresAt: string;
  payInfo: {
    qrUrl?: string;
    promptpayId?: string;
    bankAccount?: string;
    depositAmount: number;
  };
}

@Injectable()
export class BookingsService {
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly capacityService: CapacityService,
    private readonly settingsService: SettingsService,
  ) {
    this.supabase = supabaseService;
  }

  async createHold(userId: string, data: CreateHoldData): Promise<HoldResult> {
    const slotStart = TimeHelper.fromISO(data.slotStart);
    
    // Validate slot timing
    await this.validateSlotTiming(slotStart);

    // Validate service area
    await this.validateServiceArea(data.pickup);
    if (data.dropoff && !data.samePoint) {
      await this.validateServiceArea(data.dropoff);
    }

    // Start transaction
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
        slot_start: TimeHelper.toISO(slotStart),
        slot_end: TimeHelper.toISO(TimeHelper.addMinutes(slotStart, config.BOOKING_TIMEBLOCK_MINUTES)),
        status: 'HOLD_PENDING_PAYMENT',
        price_estimate: data.priceEstimate,
        deposit_minor: 2000, // 20 THB
        notes: data.notes,
        hold_expires_at: TimeHelper.toISO(TimeHelper.addMinutes(TimeHelper.now(), config.HOLD_TTL_MINUTES)),
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    // Try to reserve slot atomically
    const reserved = await this.capacityService.reserveSlot(slotStart);
    if (!reserved) {
      // Rollback booking
      await this.supabase.from('bookings').delete().eq('id', booking.id);
      throw new SlotUnavailableError(TimeHelper.toISO(slotStart));
    }

    // Create payment record
    const { error: paymentError } = await this.supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        method: 'bank_transfer',
        amount_minor: 2000,
        status: 'PENDING',
      });

    if (paymentError) {
      // Rollback
      await this.capacityService.releaseSlot(slotStart);
      await this.supabase.from('bookings').delete().eq('id', booking.id);
      throw new Error(`Failed to create payment: ${paymentError.message}`);
    }

    // Get payment information
    const paymentChannels = await this.settingsService.getPaymentChannels();
    const payInfo = this.buildPaymentInfo(paymentChannels);

    // Send LINE notification
    try {
      const user = await this.getUser(userId);
      if (user.line_user_id) {
        const message = LineHelper.createBookingHoldMessage(
          booking.id,
          TimeHelper.formatThaiDateTime(slotStart),
          TimeHelper.formatThaiDateTime(TimeHelper.fromISO(booking.hold_expires_at))
        );
        await LineHelper.pushMessage(user.line_user_id, [message]);
      }
    } catch (lineError) {
      console.error('Failed to send LINE notification:', lineError.message);
      // Don't fail the booking for LINE errors
    }

    return {
      bookingId: booking.id,
      holdExpiresAt: booking.hold_expires_at,
      payInfo: {
        ...payInfo,
        depositAmount: 20, // THB
      },
    };
  }

  async uploadPaymentSlip(userId: string, bookingId: string, file: any): Promise<any> {
    // Validate file
    const validation = StorageHelper.validateImageFile(file);
    if (!validation.isValid) {
      throw new ValidationError(validation.error);
    }

    // Get booking
    const booking = await this.getBookingByIdAndUser(bookingId, userId);

    if (booking.status !== 'HOLD_PENDING_PAYMENT') {
      throw new ConflictError('Booking is not in pending payment state');
    }

    // Check if hold has expired
    if (TimeHelper.isAfter(TimeHelper.now(), TimeHelper.fromISO(booking.hold_expires_at))) {
      throw new HoldExpiredError();
    }

    // Upload slip
    const filePath = StorageHelper.generateFilePath('slips', file.filename);
    const uploadPath = await StorageHelper.uploadFile(
      'slips',
      filePath,
      file.buffer,
      file.mimetype
    );

    // Update payment and booking
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

    // Send LINE notification
    try {
      const user = await this.getUser(userId);
      if (user.line_user_id) {
        const message = LineHelper.createPaymentPendingMessage();
        await LineHelper.pushMessage(user.line_user_id, [message]);
      }
    } catch (lineError) {
      console.error('Failed to send LINE notification:', lineError.message);
    }

    return {
      success: true,
      message: 'Payment slip uploaded successfully',
      slipUrl: `${config.RECEIPT_BASE_URL}/${uploadPath}`,
    };
  }

  async cancelHold(userId: string, bookingId: string): Promise<any> {
    const booking = await this.getBookingByIdAndUser(bookingId, userId);

    if (booking.status !== 'HOLD_PENDING_PAYMENT') {
      throw new ConflictError('Only pending payment bookings can be cancelled');
    }

    // Update booking status
    const { error: updateError } = await this.supabase
      .from('bookings')
      .update({ status: 'CANCELLED' })
      .eq('id', bookingId);

    if (updateError) {
      throw new Error(`Failed to cancel booking: ${updateError.message}`);
    }

    // Release slot capacity
    try {
      const slotStart = TimeHelper.fromISO(booking.slot_start);
      await this.capacityService.releaseSlot(slotStart);
    } catch (releaseError) {
      console.error('Failed to release slot capacity:', releaseError.message);
    }

    return {
      success: true,
      message: 'Booking cancelled successfully',
    };
  }

  async getBooking(bookingId: string, user: AuthUser): Promise<any> {
    let query = this.supabase
      .from('bookings')
      .select(`
        *,
        payments(*),
        jobs(*),
        reviews(*)
      `)
      .eq('id', bookingId);

    // Only allow users to see their own bookings (unless admin)
    if (user.role !== 'admin') {
      query = query.eq('user_id', user.id);
    }

    const { data: booking, error } = await query.single();

    if (error || !booking) {
      throw new NotFoundError('Booking', bookingId);
    }

    return this.formatBookingResponse(booking);
  }

  async getUserBookings(userId: string): Promise<any[]> {
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

  private async validateSlotTiming(slotStart: DateTime): Promise<void> {
    const now = TimeHelper.now();
    
    // Check if slot is in the past
    if (TimeHelper.isBefore(slotStart, now)) {
      throw new ValidationError('Cannot book slots in the past');
    }

    // Check if slot is too far in the future (30 days)
    const maxFutureDate = TimeHelper.addMinutes(now, 30 * 24 * 60);
    if (TimeHelper.isAfter(slotStart, maxFutureDate)) {
      throw new ValidationError('Cannot book slots more than 30 days in advance');
    }

    // Check cutoff time for current day
    if (TimeHelper.isSameDay(slotStart, now)) {
      const cutoffCheck = TimeHelper.isCurrentDayBookable(
        slotStart,
        '18:00:00', // Should come from business hours
        config.CUT_OFF_MINUTES_TODAY
      );

      if (!cutoffCheck.bookable) {
        throw new ValidationError(cutoffCheck.reason);
      }
    }
  }

  private async validateServiceArea(coordinates: { lat: number; lng: number }): Promise<void> {
    const { data: isValid, error } = await this.supabase.rpc('fn_validate_point_in_service_area', {
      lat: coordinates.lat,
      lng: coordinates.lng,
    });

    if (error) {
      throw new Error(`Service area validation failed: ${error.message}`);
    }

    if (!isValid) {
      throw new ServiceAreaError('Location is outside service area');
    }
  }

  private async getUser(userId: string): Promise<any> {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('User', userId);
    }

    return user;
  }

  private async getBookingByIdAndUser(bookingId: string, userId: string): Promise<any> {
    const { data: booking, error } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (error || !booking) {
      throw new NotFoundError('Booking', bookingId);
    }

    return booking;
  }

  private buildPaymentInfo(channels: any[]): any {
    const info: any = {};

    for (const channel of channels) {
      switch (channel.type) {
        case 'promptpay':
          info.promptpayId = channel.value;
          break;
        case 'bank_account':
          info.bankAccount = channel.value;
          break;
        case 'qr_code':
          info.qrUrl = `${config.RECEIPT_BASE_URL}/${channel.value}`;
          break;
      }
    }

    return info;
  }

  private formatBookingResponse(booking: any): any {
    // Parse geography points back to coordinates
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

  private parseGeographyToCoords(geography: string): { lat: number; lng: number } {
    // Simplified parser - in production, use proper PostGIS parsing
    if (typeof geography === 'string') {
      const match = geography.match(/POINT\(([^)]+)\)/);
      if (match) {
        const [lng, lat] = match[1].split(' ').map(Number);
        return { lat, lng };
      }
    }
    return { lat: 0, lng: 0 };
  }
}