import { AdminService } from './admin.service';
declare enum BookingStatus {
    HOLD_PENDING_PAYMENT = "HOLD_PENDING_PAYMENT",
    AWAIT_SHOP_CONFIRM = "AWAIT_SHOP_CONFIRM",
    CONFIRMED = "CONFIRMED",
    PICKUP_ASSIGNED = "PICKUP_ASSIGNED",
    PICKED_UP = "PICKED_UP",
    IN_WASH = "IN_WASH",
    READY_FOR_RETURN = "READY_FOR_RETURN",
    ON_THE_WAY_RETURN = "ON_THE_WAY_RETURN",
    COMPLETED = "COMPLETED",
    REVIEWED = "REVIEWED",
    REJECTED = "REJECTED",
    HOLD_EXPIRED = "HOLD_EXPIRED",
    CANCELLED = "CANCELLED",
    NO_SHOW = "NO_SHOW"
}
declare class BookingQueryDto {
    date?: string;
    status?: BookingStatus;
    search?: string;
    page?: string;
    limit?: string;
}
declare class RejectPaymentDto {
    reason: string;
}
declare class AssignRunnerDto {
    assignee: string;
}
declare class TransitionDto {
    next: BookingStatus;
    notes?: string;
}
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getBookings(query: BookingQueryDto): Promise<any>;
    verifyPayment(req: any, bookingId: string): Promise<any>;
    rejectPayment(req: any, bookingId: string, dto: RejectPaymentDto): Promise<any>;
    assignRunner(req: any, bookingId: string, dto: AssignRunnerDto): Promise<any>;
    transitionBooking(req: any, bookingId: string, dto: TransitionDto): Promise<any>;
    getDashboardStats(): Promise<any>;
}
export {};
