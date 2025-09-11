"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../db/supabase");
const storage_1 = require("../common/storage");
const errors_1 = require("../common/errors");
let SettingsService = class SettingsService {
    constructor() {
        this.supabase = supabase_1.supabaseService;
    }
    async getServiceArea() {
        const { data, error } = await this.supabase
            .from('service_area')
            .select('*')
            .limit(1)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to get service area: ${error.message}`);
        }
        const center = await this.parseGeography(data.center);
        return {
            center,
            radiusM: data.radius_m,
        };
    }
    async updateServiceArea(config) {
        const { center, radiusM } = config;
        if (center.lat < -90 || center.lat > 90 || center.lng < -180 || center.lng > 180) {
            throw new errors_1.ValidationError('Invalid coordinates');
        }
        if (radiusM < 100 || radiusM > 50000) {
            throw new errors_1.ValidationError('Radius must be between 100m and 50km');
        }
        const { data, error } = await this.supabase.rpc('update_service_area', {
            lat: center.lat,
            lng: center.lng,
            radius: radiusM,
        });
        if (error) {
            const { error: updateError } = await this.supabase
                .from('service_area')
                .upsert({
                center: `SRID=4326;POINT(${center.lng} ${center.lat})`,
                radius_m: radiusM,
            });
            if (updateError) {
                throw new Error(`Failed to update service area: ${updateError.message}`);
            }
        }
        return config;
    }
    async getBusinessHours() {
        const { data, error } = await this.supabase
            .from('business_hours')
            .select('*')
            .order('weekday');
        if (error) {
            throw new Error(`Failed to get business hours: ${error.message}`);
        }
        return data.map(hour => ({
            weekday: hour.weekday,
            openTime: hour.open_time,
            closeTime: hour.close_time,
            slotMinutes: hour.slot_minutes,
            defaultQuota: hour.default_quota,
            isActive: hour.is_active,
        }));
    }
    async updateBusinessHours(hours) {
        for (const hour of hours) {
            if (hour.weekday < 0 || hour.weekday > 6) {
                throw new errors_1.ValidationError(`Invalid weekday: ${hour.weekday}`);
            }
            if (!this.isValidTime(hour.openTime) || !this.isValidTime(hour.closeTime)) {
                throw new errors_1.ValidationError('Invalid time format');
            }
            if (hour.slotMinutes < 15 || hour.slotMinutes > 240) {
                throw new errors_1.ValidationError('Slot minutes must be between 15 and 240');
            }
            if (hour.defaultQuota < 1 || hour.defaultQuota > 50) {
                throw new errors_1.ValidationError('Default quota must be between 1 and 50');
            }
        }
        const results = [];
        for (const hour of hours) {
            const { data, error } = await this.supabase
                .from('business_hours')
                .upsert({
                weekday: hour.weekday,
                open_time: hour.openTime,
                close_time: hour.closeTime,
                slot_minutes: hour.slotMinutes,
                default_quota: hour.defaultQuota,
                is_active: hour.isActive ?? true,
            }, {
                onConflict: 'weekday',
            })
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to update business hour: ${error.message}`);
            }
            results.push({
                weekday: data.weekday,
                openTime: data.open_time,
                closeTime: data.close_time,
                slotMinutes: data.slot_minutes,
                defaultQuota: data.default_quota,
                isActive: data.is_active,
            });
        }
        return results;
    }
    async getPaymentChannels() {
        const { data, error } = await this.supabase
            .from('payment_channels')
            .select('*')
            .eq('is_active', true)
            .order('display_order');
        if (error) {
            throw new Error(`Failed to get payment channels: ${error.message}`);
        }
        return data.map(channel => ({
            type: channel.type,
            name: channel.name,
            value: channel.value,
            isActive: channel.is_active,
            displayOrder: channel.display_order,
        }));
    }
    async updatePaymentChannels(channels, qrFile) {
        const results = [];
        for (const channel of channels) {
            let value = channel.value;
            if (channel.type === 'qr_code' && qrFile) {
                const validation = storage_1.StorageHelper.validateImageFile(qrFile);
                if (!validation.isValid) {
                    throw new errors_1.ValidationError(validation.error);
                }
                const filePath = storage_1.StorageHelper.generateFilePath('qr-codes', qrFile.filename);
                const uploadPath = await storage_1.StorageHelper.uploadFile('slips', filePath, qrFile.buffer, qrFile.mimetype);
                value = uploadPath;
            }
            const { data, error } = await this.supabase
                .from('payment_channels')
                .upsert({
                type: channel.type,
                name: channel.name,
                value,
                is_active: channel.isActive ?? true,
                display_order: channel.displayOrder ?? 0,
            }, {
                onConflict: 'type,name',
            })
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to update payment channel: ${error.message}`);
            }
            results.push({
                type: data.type,
                name: data.name,
                value: data.value,
                isActive: data.is_active,
                displayOrder: data.display_order,
            });
        }
        return results;
    }
    async parseGeography(geography) {
        if (typeof geography === 'string') {
            const match = geography.match(/POINT\(([^)]+)\)/);
            if (match) {
                const [lng, lat] = match[1].split(' ').map(Number);
                return { lat, lng };
            }
        }
        return { lat: 16.474, lng: 102.821 };
    }
    isValidTime(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        return timeRegex.test(time);
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SettingsService);
//# sourceMappingURL=settings.service.js.map