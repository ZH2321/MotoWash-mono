import { DateTime } from 'luxon';
export declare class TimeHelper {
    private static readonly TIMEZONE;
    static now(): DateTime;
    static fromISO(isoString: string): DateTime;
    static fromJSDate(date: Date): DateTime;
    static toISODate(date: DateTime): string;
    static toISO(date: DateTime): string;
    static format(date: DateTime, format: string): string;
    static addMinutes(date: DateTime, minutes: number): DateTime;
    static isBefore(date1: DateTime, date2: DateTime): boolean;
    static isAfter(date1: DateTime, date2: DateTime): boolean;
    static isSameDay(date1: DateTime, date2: DateTime): boolean;
    static getWeekday(date: DateTime): number;
    static createTime(hour: number, minute?: number): string;
    static timeToMinutes(timeString: string): number;
    static minutesToTime(minutes: number): string;
    static isCurrentDayBookable(slotStart: DateTime, businessClose: string, cutOffMinutes?: number): {
        bookable: boolean;
        reason?: string;
    };
    static generateTimeSlots(date: string, openTime: string, closeTime: string, slotMinutes?: number): DateTime[];
    static formatForDisplay(date: DateTime): string;
    static formatDateForDisplay(date: DateTime): string;
    static formatTimeForDisplay(date: DateTime): string;
    static formatThaiDate(date: DateTime): string;
    static formatThaiDateTime(date: DateTime): string;
}
