import { DateTime } from 'luxon';
import { SettingsService } from '../settings/settings.service';
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
export declare class CapacityService {
    private readonly settingsService;
    private readonly supabase;
    constructor(settingsService: SettingsService);
    getAvailability(date: string, endDate?: string): Promise<DayAvailability[]>;
    private getDayAvailability;
    private getBusinessHoursForDay;
    private isDayBookable;
    private generateSlotsForDay;
    private getSlotAvailability;
    private getSlotOverride;
    reserveSlot(slotStart: DateTime): Promise<boolean>;
    releaseSlot(slotStart: DateTime): Promise<void>;
    confirmSlot(slotStart: DateTime): Promise<void>;
}
export {};
