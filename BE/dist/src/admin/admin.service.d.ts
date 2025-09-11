import { CapacityService } from '../capacity/capacity.service';
type BookingStatus = 'HOLD_PENDING_PAYMENT' | 'AWAIT_SHOP_CONFIRM' | 'CONFIRMED' | 'PICKUP_ASSIGNED' | 'PICKED_UP' | 'IN_WASH' | 'READY_FOR_RETURN' | 'ON_THE_WAY_RETURN' | 'COMPLETED' | 'REVIEWED' | 'REJECTED' | 'HOLD_EXPIRED' | 'CANCELLED' | 'NO_SHOW';
interface BookingQuery {
    date?: string;
    status?: BookingStatus;
    search?: string;
    page?: string;
    limit?: string;
}
export declare class AdminService {
    private readonly capacityService;
    private readonly supabase;
    private readonly STATUS_TRANSITIONS;
    private readonly STATUS_MESSAGES;
    constructor(capacityService: CapacityService);
    getBookings(query: BookingQuery): Promise<any>;
    verifyPayment(bookingId: string, adminId: string): Promise<any>;
    rejectPayment(bookingId: string, reason: string, adminId: string): Promise<any>;
    assignRunner(bookingId: string, assignee: string, adminId: string): Promise<any>;
    transitionBooking(bookingId: string, nextStatus: BookingStatus, notes?: string, adminId?: string): Promise<any>;
    getDashboardStats(): Promise<any>;
    private getBookingById;
    private getBookingCount;
    private getWeeklyStats;
    private updateJobPhase;
    private sendLineNotification;
    private formatAdminBookingResponse;
    private parseGeographyToCoords;
}
export {};
