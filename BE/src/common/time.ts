import { DateTime } from 'luxon';
import { config } from './config';

export class TimeHelper {
  private static readonly TIMEZONE = config.TZ;

  static now(): DateTime {
    return DateTime.now().setZone(this.TIMEZONE);
  }

  static fromISO(isoString: string): DateTime {
    return DateTime.fromISO(isoString).setZone(this.TIMEZONE);
  }

  static fromJSDate(date: Date): DateTime {
    return DateTime.fromJSDate(date).setZone(this.TIMEZONE);
  }

  static toISODate(date: DateTime): string {
    return date.toISODate();
  }

  static toISO(date: DateTime): string {
    return date.toISO();
  }

  static format(date: DateTime, format: string): string {
    return date.toFormat(format);
  }

  static addMinutes(date: DateTime, minutes: number): DateTime {
    return date.plus({ minutes });
  }

  static isBefore(date1: DateTime, date2: DateTime): boolean {
    return date1 < date2;
  }

  static isAfter(date1: DateTime, date2: DateTime): boolean {
    return date1 > date2;
  }

  static isSameDay(date1: DateTime, date2: DateTime): boolean {
    return date1.hasSame(date2, 'day');
  }

  static getWeekday(date: DateTime): number {
    // Convert to 0-6 (Sunday-Saturday) to match database
    return date.weekday === 7 ? 0 : date.weekday;
  }

  static createTime(hour: number, minute: number = 0): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
  }

  static timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return this.createTime(hours, mins);
  }

  static isCurrentDayBookable(
    slotStart: DateTime,
    businessClose: string,
    cutOffMinutes: number = config.CUT_OFF_MINUTES_TODAY,
  ): { bookable: boolean; reason?: string } {
    const now = this.now();
    
    // Check if slot is in the past
    if (this.isBefore(slotStart, now)) {
      return { bookable: false, reason: 'Slot is in the past' };
    }

    // Check if we're past business closing time for today
    const closeTime = now.startOf('day').set({
      hour: parseInt(businessClose.split(':')[0]),
      minute: parseInt(businessClose.split(':')[1]),
    });

    if (this.isAfter(now, closeTime)) {
      return { bookable: false, reason: 'Business is closed for today' };
    }

    // Check cutoff time for today's slots
    if (this.isSameDay(slotStart, now)) {
      const cutoffTime = this.addMinutes(slotStart, -cutOffMinutes);
      if (this.isAfter(now, cutoffTime)) {
        return { bookable: false, reason: `Cutoff time passed (${cutOffMinutes} minutes before slot)` };
      }
    }

    return { bookable: true };
  }

  static generateTimeSlots(
    date: string,
    openTime: string,
    closeTime: string,
    slotMinutes: number = config.BOOKING_TIMEBLOCK_MINUTES,
  ): DateTime[] {
    const startDate = DateTime.fromISO(date).setZone(this.TIMEZONE);
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);

    const start = startDate.set({ hour: openHour, minute: openMinute, second: 0, millisecond: 0 });
    const end = startDate.set({ hour: closeHour, minute: closeMinute, second: 0, millisecond: 0 });

    const slots: DateTime[] = [];
    let current = start;

    while (current.plus({ minutes: slotMinutes }) <= end) {
      slots.push(current);
      current = current.plus({ minutes: slotMinutes });
    }

    return slots;
  }

  static formatForDisplay(date: DateTime): string {
    return date.toFormat('dd/MM/yyyy HH:mm');
  }

  static formatDateForDisplay(date: DateTime): string {
    return date.toFormat('dd/MM/yyyy');
  }

  static formatTimeForDisplay(date: DateTime): string {
    return date.toFormat('HH:mm');
  }

  // Thai locale formatting
  static formatThaiDate(date: DateTime): string {
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    const thaiYear = date.year + 543;
    const thaiMonth = thaiMonths[date.month - 1];
    
    return `${date.day} ${thaiMonth} ${thaiYear}`;
  }

  static formatThaiDateTime(date: DateTime): string {
    return `${this.formatThaiDate(date)} เวลา ${this.formatTimeForDisplay(date)} น.`;
  }
}