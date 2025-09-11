import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseService } from '../db/supabase';
import { StorageHelper } from '../common/storage';
import { NotFoundError, ValidationError } from '../common/errors';

export interface ServiceAreaConfig {
  center: { lat: number; lng: number };
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

@Injectable()
export class SettingsService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = supabaseService;
  }

  async getServiceArea(): Promise<ServiceAreaConfig | null> {
    const { data, error } = await this.supabase
      .from('service_area')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No service area configured
      }
      throw new Error(`Failed to get service area: ${error.message}`);
    }

    // Convert PostGIS geography to lat/lng
    const center = await this.parseGeography(data.center);
    
    return {
      center,
      radiusM: data.radius_m,
    };
  }

  async updateServiceArea(config: ServiceAreaConfig): Promise<ServiceAreaConfig> {
    const { center, radiusM } = config;

    // Validate coordinates
    if (center.lat < -90 || center.lat > 90 || center.lng < -180 || center.lng > 180) {
      throw new ValidationError('Invalid coordinates');
    }

    if (radiusM < 100 || radiusM > 50000) {
      throw new ValidationError('Radius must be between 100m and 50km');
    }

    // Use PostGIS to create geography point
    const { data, error } = await this.supabase.rpc('update_service_area', {
      lat: center.lat,
      lng: center.lng,
      radius: radiusM,
    });

    if (error) {
      // Fallback: manual update if RPC not available
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

  async getBusinessHours(): Promise<BusinessHour[]> {
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

  async updateBusinessHours(hours: BusinessHour[]): Promise<BusinessHour[]> {
    // Validate business hours
    for (const hour of hours) {
      if (hour.weekday < 0 || hour.weekday > 6) {
        throw new ValidationError(`Invalid weekday: ${hour.weekday}`);
      }

      if (!this.isValidTime(hour.openTime) || !this.isValidTime(hour.closeTime)) {
        throw new ValidationError('Invalid time format');
      }

      if (hour.slotMinutes < 15 || hour.slotMinutes > 240) {
        throw new ValidationError('Slot minutes must be between 15 and 240');
      }

      if (hour.defaultQuota < 1 || hour.defaultQuota > 50) {
        throw new ValidationError('Default quota must be between 1 and 50');
      }
    }

    // Update each business hour
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

  async getPaymentChannels(): Promise<PaymentChannel[]> {
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

  async updatePaymentChannels(channels: PaymentChannel[], qrFile?: any): Promise<PaymentChannel[]> {
    const results = [];

    for (const channel of channels) {
      let value = channel.value;

      // Handle QR code file upload
      if (channel.type === 'qr_code' && qrFile) {
        const validation = StorageHelper.validateImageFile(qrFile);
        if (!validation.isValid) {
          throw new ValidationError(validation.error);
        }

        const filePath = StorageHelper.generateFilePath('qr-codes', qrFile.filename);
        const uploadPath = await StorageHelper.uploadFile(
          'slips',
          filePath,
          qrFile.buffer,
          qrFile.mimetype
        );
        
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

  private async parseGeography(geography: any): Promise<{ lat: number; lng: number }> {
    // This is a simplified parser - in production, use a proper PostGIS client
    // or query the coordinates directly from the database
    if (typeof geography === 'string') {
      const match = geography.match(/POINT\(([^)]+)\)/);
      if (match) {
        const [lng, lat] = match[1].split(' ').map(Number);
        return { lat, lng };
      }
    }
    
    // Fallback: assume it's already parsed
    return { lat: 16.474, lng: 102.821 }; // Default coordinates
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return timeRegex.test(time);
  }
}