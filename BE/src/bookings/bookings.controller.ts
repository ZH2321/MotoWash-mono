import { 
  Controller, 
  Post, 
  Get,
  Body, 
  Param, 
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  IsArray, 
  IsString, 
  IsNumber, 
  IsObject, 
  IsBoolean, 
  IsOptional,
  ValidateNested,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuthGuard, Roles, AuthUser } from '../common/auth.guard';
import { BookingsService, HoldResult } from './bookings.service';

class CoordinateDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

class CreateHoldDto {
  @IsArray()
  @IsString({ each: true })
  services: string[];

  @ValidateNested()
  @Type(() => CoordinateDto)
  pickup: CoordinateDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinateDto)
  dropoff?: CoordinateDto;

  @IsBoolean()
  samePoint: boolean;

  @IsDateString()
  slotStart: string;

  @IsNumber()
  @Min(0)
  priceEstimate: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('hold')
  @UseGuards(AuthGuard)
  @Roles(['customer'])
  async createHold(@Request() req, @Body() dto: CreateHoldDto): Promise<HoldResult> {
    const user: AuthUser = req.user;
    return this.bookingsService.createHold(user.id, dto);
  }

  @Post(':id/payment-slip')
  @UseGuards(AuthGuard)
  @Roles(['customer'])
  @UseInterceptors(FileInterceptor('slip'))
  async uploadPaymentSlip(
    @Request() req,
    @Param('id', ParseUUIDPipe) bookingId: string,
    @UploadedFile() file: any
  ) {
    const user: AuthUser = req.user;
    return this.bookingsService.uploadPaymentSlip(user.id, bookingId, file);
  }

  @Post(':id/cancel-hold')
  @UseGuards(AuthGuard)
  @Roles(['customer'])
  async cancelHold(
    @Request() req,
    @Param('id', ParseUUIDPipe) bookingId: string
  ) {
    const user: AuthUser = req.user;
    return this.bookingsService.cancelHold(user.id, bookingId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getBooking(
    @Request() req,
    @Param('id', ParseUUIDPipe) bookingId: string
  ) {
    const user: AuthUser = req.user;
    return this.bookingsService.getBooking(bookingId, user);
  }

  @Get('user/my-bookings')
  @UseGuards(AuthGuard)
  @Roles(['customer'])
  async getMyBookings(@Request() req) {
    const user: AuthUser = req.user;
    return this.bookingsService.getUserBookings(user.id);
  }
}