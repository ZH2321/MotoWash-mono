export interface ServiceAreaConfig {
    center: {
        lat: number;
        lng: number;
    };
    radiusM: number;
}
export interface BusinessHour {
    weekday: number;
    openTime: string;
    closeTime: string;
    slotMinutes: number;
    defaultQuota: number;
    isActive?: boolean;
}
export interface PaymentChannel {
    type: string;
    name: string;
    value: string;
    isActive?: boolean;
    displayOrder?: number;
}
export declare class SettingsService {
    private readonly supabase;
    constructor();
    getServiceArea(): Promise<ServiceAreaConfig | null>;
    updateServiceArea(config: ServiceAreaConfig): Promise<ServiceAreaConfig>;
    getBusinessHours(): Promise<BusinessHour[]>;
    updateBusinessHours(hours: BusinessHour[]): Promise<BusinessHour[]>;
    getPaymentChannels(): Promise<PaymentChannel[]>;
    updatePaymentChannels(channels: PaymentChannel[], qrFile?: any): Promise<PaymentChannel[]>;
    private parseGeography;
    private isValidTime;
}
