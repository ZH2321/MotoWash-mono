import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';
import { supabaseService } from '../db/supabase';
import { CapacityService } from '../capacity/capacity.service';
import { TimeHelper } from '../common/time';
import { LineHelper } from '../common/line';
import { 
  NotFoundError, 
  ConflictError, 
  InvalidTransitionError,
  ValidationError,
} from '../common/errors';

type BookingStatus = 
  | 'HOLD_PENDING_PAYMENT'
  | 'AWAIT_SHOP_CONFIRM'
  | 'CONFIRMED'
  | 'PICKUP_ASSIGNED'
  | 'PICKED_UP'
  | 'IN_WASH'
  | 'READY_FOR_RETURN'
  | 'ON_THE_WAY_RETURN'
  | 'COMPLETED'
  | 'REVIEWED'
  | 'REJECTED'
  | 'HOLD_EXPIRED'
  | 'CANCELLED'
  | 'NO_SHOW';

interface BookingQuery {
  date?: string;
  status?: BookingStatus;
  search?: string;
  page?: string;
  limit?: string;
}

@Injectable()
export class AdminService {
  private readonly supabase: SupabaseClient;

  private readonly STATUS_TRANSITIONS = new Map<BookingStatus, BookingStatus[]>([
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

  private readonly STATUS_MESSAGES = new Map<BookingStatus, string>([
    ['PICKUP_ASSIGNED', '🏃‍♂️ พนักงานกำลังเดินทางไปรับรถ'],
    ['PICKED_UP', '🚗 พนักงานรับรถเรียบร้อยแล้ว'],
    ['IN_WASH', '🧽 รถของคุณกำลังล้าง'],
    ['READY_FOR_RETURN', '✨ ล้างเสร็จแล้ว พร้อมส่งคืน'],
    ['ON_THE_WAY_RETURN', '🚚 กำลังเดินทางส่งรถคืน'],
    ['COMPLETED', '🎉 เสร็จสิ้น ขอบคุณที่ใช้บริการ'],
  ]);

  constructor(private readonly capacityService: CapacityService) {
    this.supabase = supabaseService;
  }

  async getBookings(query: BookingQuery): Promise<any> {
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

    // Apply filters
    if (query.date) {
      const date = DateTime.fromISO(query.date).setZone('Asia/Bangkok');
      const startOfDay = TimeHelper.toISO(date.startOf('day'));
      const endOfDay = TimeHelper.toISO(date.endOf('day'));
      
      dbQuery = dbQuery.gte('slot_start', startOfDay).lte('slot_start', endOfDay);
    }

    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.search) {
      // Search in booking ID or user display name
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

  async verifyPayment(bookingId: string, adminId: string): Promise<any> {
    const booking = await this.getBookingById(bookingId);

    if (booking.status !== 'AWAIT_SHOP_CONFIRM') {
      throw new ConflictError('Booking is not awaiting payment confirmation');
    }

    // Start transaction
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

    // Confirm slot capacity
    try {
      const slotStart = TimeHelper.fromISO(booking.slot_start);
      await this.capacityService.confirmSlot(slotStart);
    } catch (capacityError) {
      console.error('Failed to confirm slot capacity:', capacityError.message);
    }

    // Send LINE notification
    await this.sendLineNotification(booking, 'CONFIRMED');

    return {
      success: true,
      message: 'Payment verified successfully',
    };
  }

  async rejectPayment(bookingId: string, reason: string, adminId: string): Promise<any> {
    const booking = await this.getBookingById(bookingId);

    if (booking.status !== 'AWAIT_SHOP_CONFIRM') {
      throw new ConflictError('Booking is not awaiting payment confirmation');
    }

    // Update payment and booking
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

    // Release slot capacity
    try {
      const slotStart = TimeHelper.fromISO(booking.slot_start);
      await this.capacityService.releaseSlot(slotStart);
    } catch (capacityError) {
      console.error('Failed to release slot capacity:', capacityError.message);
    }

    // Send LINE notification
    await this.sendLineNotification(booking, 'REJECTED', reason);

    return {
      success: true,
      message: 'Payment rejected successfully',
    };
  }

  async assignRunner(bookingId: string, assignee: string, adminId: string): Promise<any> {
    const booking = await this.getBookingById(bookingId);

    if (booking.status !== 'CONFIRMED') {
      throw new ConflictError('Only confirmed bookings can have runners assigned');
    }

    // Create or update job assignment
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

    // Update booking status
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

    // Send LINE notification
    await this.sendLineNotification(booking, 'PICKUP_ASSIGNED');

    return {
      success: true,
      message: `Runner ${assignee} assigned successfully`,
    };
  }

  async transitionBooking(
    bookingId: string, 
    nextStatus: BookingStatus, 
    notes?: string,
    adminId?: string
  ): Promise<any> {
    const booking = await this.getBookingById(bookingId);
    const currentStatus = booking.status as BookingStatus;

    // Validate transition
    const allowedTransitions = this.STATUS_TRANSITIONS.get(currentStatus) || [];
    if (!allowedTransitions.includes(nextStatus)) {
      throw new InvalidTransitionError(currentStatus, nextStatus);
    }

    // Update booking
    const updateData: any = {
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

    // Update job if applicable
    if (['PICKED_UP', 'IN_WASH', 'READY_FOR_RETURN', 'ON_THE_WAY_RETURN', 'COMPLETED'].includes(nextStatus)) {
      await this.updateJobPhase(bookingId, nextStatus, notes);
    }

    // Send LINE notification
    await this.sendLineNotification(booking, nextStatus);

    return {
      success: true,
      message: `Booking status updated to ${nextStatus}`,
    };
  }

  async getDashboardStats(): Promise<any> {
    const today = TimeHelper.now().startOf('day');
    const todayStart = TimeHelper.toISO(today);
    const todayEnd = TimeHelper.toISO(today.endOf('day'));

    // Today's stats
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

    // Weekly trend
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

  private async getBookingById(bookingId: string): Promise<any> {
    const { data: booking, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        users(display_name, phone, line_user_id)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw new NotFoundError('Booking', bookingId);
    }

    return booking;
  }

  private async getBookingCount(filters: {
    status?: BookingStatus | BookingStatus[];
    startDate?: string;
    endDate?: string;
  }): Promise<number> {
    let query = this.supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
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

  private async getWeeklyStats(): Promise<any[]> {
    const stats = [];
    const today = TimeHelper.now().startOf('day');

    for (let i = 6; i >= 0; i--) {
      const date = today.minus({ days: i });
      const startOfDay = TimeHelper.toISO(date);
      const endOfDay = TimeHelper.toISO(date.endOf('day'));

      const bookingCount = await this.getBookingCount({
        startDate: startOfDay,
        endDate: endOfDay,
      });

      stats.push({
        date: TimeHelper.toISODate(date),
        bookings: bookingCount,
      });
    }

    return stats;
  }

  private async updateJobPhase(bookingId: string, status: BookingStatus, notes?: string): Promise<void> {
    const phaseMap = {
      'PICKED_UP': 'pickup',
      'IN_WASH': 'wash',
      'READY_FOR_RETURN': 'wash',
      'ON_THE_WAY_RETURN': 'return',
      'COMPLETED': 'return',
    };

    const phase = phaseMap[status];
    if (!phase) return;

    const updateData: any = {
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

  private async sendLineNotification(booking: any, status: BookingStatus, reason?: string): Promise<void> {
    try {
      const user = booking.users || booking.user;
      if (!user?.line_user_id) return;

      let message;

      switch (status) {
        case 'CONFIRMED':
          message = LineHelper.createBookingConfirmedMessage();
          break;
        case 'REJECTED':
          message = LineHelper.createPaymentRejectedMessage(reason || 'ไม่ระบุเหตุผล');
          break;
        default:
          const statusText = this.STATUS_MESSAGES.get(status);
          if (statusText) {
            message = LineHelper.createStatusUpdateMessage(status, statusText);
          }
          break;
      }

      if (message) {
        await LineHelper.pushMessage(user.line_user_id, [message]);
      }
    } catch (error) {
      console.error('Failed to send LINE notification:', error.message);
    }
  }

  private formatAdminBookingResponse(booking: any): any {
    // Parse geography points back to coordinates
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