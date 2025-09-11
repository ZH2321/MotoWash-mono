import { SettingsService, ServiceAreaConfig, BusinessHour, PaymentChannel } from './settings.service';
declare class CoordinateDto {
    lat: number;
    lng: number;
}
declare class ServiceAreaDto {
    center: CoordinateDto;
    radiusM: number;
}
declare class BusinessHourDto {
    weekday: number;
    openTime: string;
    closeTime: string;
    slotMinutes: number;
    defaultQuota: number;
    isActive?: boolean;
}
declare class PaymentChannelDto {
    type: string;
    name: string;
    value: string;
    isActive?: boolean;
    displayOrder?: number;
}
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getServiceArea(): Promise<ServiceAreaConfig | null>;
    updateServiceArea(dto: ServiceAreaDto): Promise<ServiceAreaConfig>;
    getBusinessHours(): Promise<BusinessHour[]>;
    updateBusinessHours(dto: BusinessHourDto[]): Promise<BusinessHour[]>;
    getPaymentChannels(): Promise<PaymentChannel[]>;
    updatePaymentChannels(dto: PaymentChannelDto[], qrFile?: any): Promise<PaymentChannel[]>;
}
export {};
