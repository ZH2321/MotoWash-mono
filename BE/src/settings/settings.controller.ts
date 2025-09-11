import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsNumber, IsObject, ValidateNested, IsOptional, IsArray, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { AuthGuard, Roles } from '../common/auth.guard';
import { SettingsService, ServiceAreaConfig, BusinessHour, PaymentChannel } from './settings.service';

class CoordinateDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

class ServiceAreaDto {
  @ValidateNested()
  @Type(() => CoordinateDto)
  center: CoordinateDto;

  @IsNumber()
  radiusM: number;
}

class BusinessHourDto {
  @IsNumber()
  weekday: number;

  @IsString()
  openTime: string;

  @IsString()
  closeTime: string;

  @IsNumber()
  slotMinutes: number;

  @IsNumber()
  defaultQuota: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class PaymentChannelDto {
  @IsString()
  type: string;

  @IsString()
  name: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('service-area')
  async getServiceArea(): Promise<ServiceAreaConfig | null> {
    return this.settingsService.getServiceArea();
  }

  @Post('service-area')
  @UseGuards(AuthGuard)
  @Roles(['admin'])
  async updateServiceArea(@Body() dto: ServiceAreaDto): Promise<ServiceAreaConfig> {
    return this.settingsService.updateServiceArea(dto);
  }

  @Get('business-hours')
  async getBusinessHours(): Promise<BusinessHour[]> {
    return this.settingsService.getBusinessHours();
  }

  @Post('business-hours')
  @UseGuards(AuthGuard)
  @Roles(['admin'])
  async updateBusinessHours(@Body() dto: BusinessHourDto[]): Promise<BusinessHour[]> {
    return this.settingsService.updateBusinessHours(dto);
  }

  @Get('payment-channels')
  async getPaymentChannels(): Promise<PaymentChannel[]> {
    return this.settingsService.getPaymentChannels();
  }

  @Post('payment-channels')
  @UseGuards(AuthGuard)
  @Roles(['admin'])
  @UseInterceptors(FileInterceptor('qrFile'))
  async updatePaymentChannels(
    @Body() dto: PaymentChannelDto[],
    @UploadedFile() qrFile?: any
  ): Promise<PaymentChannel[]> {
    return this.settingsService.updatePaymentChannels(dto, qrFile);
  }
}