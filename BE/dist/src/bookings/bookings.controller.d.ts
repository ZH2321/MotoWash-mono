import { BookingsService, HoldResult } from './bookings.service';
declare class CoordinateDto {
    lat: number;
    lng: number;
}
declare class CreateHoldDto {
    services: string[];
    pickup: CoordinateDto;
    dropoff?: CoordinateDto;
    samePoint: boolean;
    slotStart: string;
    priceEstimate: number;
    notes?: string;
}
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    createHold(req: any, dto: CreateHoldDto): Promise<HoldResult>;
    uploadPaymentSlip(req: any, bookingId: string, file: any): Promise<any>;
    cancelHold(req: any, bookingId: string): Promise<any>;
    getBooking(req: any, bookingId: string): Promise<any>;
    getMyBookings(req: any): Promise<any[]>;
}
export {};
