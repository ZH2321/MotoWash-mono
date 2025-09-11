import { CapacityService } from '../capacity/capacity.service';
export declare class TtlService {
    private readonly capacityService;
    private readonly logger;
    private readonly supabase;
    constructor(capacityService: CapacityService);
    handleExpiredHolds(): Promise<void>;
    private findAndExpireHolds;
    private releaseExpiredCapacity;
    private notifyExpiredBookings;
    cleanupOldBookings(): Promise<void>;
    generateUpcomingCapacity(): Promise<void>;
    private generateCapacityForDate;
}
