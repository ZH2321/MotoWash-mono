"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeHelper = void 0;
const luxon_1 = require("luxon");
const config_1 = require("./config");
class TimeHelper {
    static now() {
        return luxon_1.DateTime.now().setZone(this.TIMEZONE);
    }
    static fromISO(isoString) {
        return luxon_1.DateTime.fromISO(isoString).setZone(this.TIMEZONE);
    }
    static fromJSDate(date) {
        return luxon_1.DateTime.fromJSDate(date).setZone(this.TIMEZONE);
    }
    static toISODate(date) {
        return date.toISODate();
    }
    static toISO(date) {
        return date.toISO();
    }
    static format(date, format) {
        return date.toFormat(format);
    }
    static addMinutes(date, minutes) {
        return date.plus({ minutes });
    }
    static isBefore(date1, date2) {
        return date1 < date2;
    }
    static isAfter(date1, date2) {
        return date1 > date2;
    }
    static isSameDay(date1, date2) {
        return date1.hasSame(date2, 'day');
    }
    static getWeekday(date) {
        return date.weekday === 7 ? 0 : date.weekday;
    }
    static createTime(hour, minute = 0) {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    }
    static timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }
    static minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return this.createTime(hours, mins);
    }
    static isCurrentDayBookable(slotStart, businessClose, cutOffMinutes = config_1.config.CUT_OFF_MINUTES_TODAY) {
        const now = this.now();
        if (this.isBefore(slotStart, now)) {
            return { bookable: false, reason: 'Slot is in the past' };
        }
        const closeTime = now.startOf('day').set({
            hour: parseInt(businessClose.split(':')[0]),
            minute: parseInt(businessClose.split(':')[1]),
        });
        if (this.isAfter(now, closeTime)) {
            return { bookable: false, reason: 'Business is closed for today' };
        }
        if (this.isSameDay(slotStart, now)) {
            const cutoffTime = this.addMinutes(slotStart, -cutOffMinutes);
            if (this.isAfter(now, cutoffTime)) {
                return { bookable: false, reason: `Cutoff time passed (${cutOffMinutes} minutes before slot)` };
            }
        }
        return { bookable: true };
    }
    static generateTimeSlots(date, openTime, closeTime, slotMinutes = config_1.config.BOOKING_TIMEBLOCK_MINUTES) {
        const startDate = luxon_1.DateTime.fromISO(date).setZone(this.TIMEZONE);
        const [openHour, openMinute] = openTime.split(':').map(Number);
        const [closeHour, closeMinute] = closeTime.split(':').map(Number);
        const start = startDate.set({ hour: openHour, minute: openMinute, second: 0, millisecond: 0 });
        const end = startDate.set({ hour: closeHour, minute: closeMinute, second: 0, millisecond: 0 });
        const slots = [];
        let current = start;
        while (current.plus({ minutes: slotMinutes }) <= end) {
            slots.push(current);
            current = current.plus({ minutes: slotMinutes });
        }
        return slots;
    }
    static formatForDisplay(date) {
        return date.toFormat('dd/MM/yyyy HH:mm');
    }
    static formatDateForDisplay(date) {
        return date.toFormat('dd/MM/yyyy');
    }
    static formatTimeForDisplay(date) {
        return date.toFormat('HH:mm');
    }
    static formatThaiDate(date) {
        const thaiMonths = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        const thaiYear = date.year + 543;
        const thaiMonth = thaiMonths[date.month - 1];
        return `${date.day} ${thaiMonth} ${thaiYear}`;
    }
    static formatThaiDateTime(date) {
        return `${this.formatThaiDate(date)} เวลา ${this.formatTimeForDisplay(date)} น.`;
    }
}
exports.TimeHelper = TimeHelper;
TimeHelper.TIMEZONE = config_1.config.TZ;
//# sourceMappingURL=time.js.map