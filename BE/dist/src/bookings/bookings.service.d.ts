import { CapacityService } from '../capacity/capacity.service';
import { SettingsService } from '../settings/settings.service';
import { AuthUser } from '../common/auth.guard';
interface CreateHoldData {
    services: string[];
    pickup: {
        lat: number;
        lng: number;
    };
    dropoff?: {
        lat: number;
        lng: number;
    };
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
export declare class BookingsService {
    private readonly capacityService;
    private readonly settingsService;
    private readonly supabase;
    constructor(capacityService: CapacityService, settingsService: SettingsService);
    createHold(userId: string, data: CreateHoldData): Promise<HoldResult>;
    uploadPaymentSlip(userId: string, bookingId: string, file: any): Promise<any>;
    cancelHold(userId: string, bookingId: string): Promise<any>;
    getBooking(bookingId: string, user: AuthUser): Promise<any>;
    getUserBookings(userId: string): Promise<any[]>;
    private validateSlotTiming;
    private validateServiceArea;
    private getUser;
    private getBookingByIdAndUser;
    private buildPaymentInfo;
    private formatBookingResponse;
    private parseGeographyToCoords;
}
export {};
