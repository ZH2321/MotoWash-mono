import { CapacityService, DayAvailability } from './capacity.service';
declare class AvailabilityQueryDto {
    date: string;
    endDate?: string;
}
export declare class CapacityController {
    private readonly capacityService;
    constructor(capacityService: CapacityService);
    getAvailability(query: AvailabilityQueryDto): Promise<DayAvailability[]>;
}
export {};
