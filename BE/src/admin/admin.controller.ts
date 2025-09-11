import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { 
  IsString, 
  IsOptional, 
  IsEnum,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { AuthGuard, Roles, AuthUser } from '../common/auth.guard';
import { AdminService } from './admin.service';

enum BookingStatus {
  HOLD_PENDING_PAYMENT = 'HOLD_PENDING_PAYMENT',
  AWAIT_SHOP_CONFIRM = 'AWAIT_SHOP_CONFIRM',
  CONFIRMED = 'CONFIRMED',
  PICKUP_ASSIGNED = 'PICKUP_ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_WASH = 'IN_WASH',
  READY_FOR_RETURN = 'READY_FOR_RETURN',
  ON_THE_WAY_RETURN = 'ON_THE_WAY_RETURN',
  COMPLETED = 'COMPLETED',
  REVIEWED = 'REVIEWED',
  REJECTED = 'REJECTED',
  HOLD_EXPIRED = 'HOLD_EXPIRED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

class BookingQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

class RejectPaymentDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

class AssignRunnerDto {
  @IsString()
  @IsNotEmpty()
  assignee: string;
}

class TransitionDto {
  @IsEnum(BookingStatus)
  next: BookingStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('admin')
@UseGuards(AuthGuard)
@Roles(['admin'])
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('bookings')
  async getBookings(@Query() query: BookingQueryDto) {
    return this.adminService.getBookings(query);
  }

  @Post('bookings/:id/verify-payment')
  async verifyPayment(
    @Request() req,
    @Param('id', ParseUUIDPipe) bookingId: string
  ) {
    const admin: AuthUser = req.user;
    return this.adminService.verifyPayment(bookingId, admin.id);
  }

  @Post('bookings/:id/reject-payment')
  async rejectPayment(
    @Request() req,
    @Param('id', ParseUUIDPipe) bookingId: string,
    @Body() dto: RejectPaymentDto
  ) {
    const admin: AuthUser = req.user;
    return this.adminService.rejectPayment(bookingId, dto.reason, admin.id);
  }

  @Post('bookings/:id/assign-runner')
  async assignRunner(
    @Request() req,
    @Param('id', ParseUUIDPipe) bookingId: string,
    @Body() dto: AssignRunnerDto
  ) {
    const admin: AuthUser = req.user;
    return this.adminService.assignRunner(bookingId, dto.assignee, admin.id);
  }

  @Post('bookings/:id/transition')
  async transitionBooking(
    @Request() req,
    @Param('id', ParseUUIDPipe) bookingId: string,
    @Body() dto: TransitionDto
  ) {
    const admin: AuthUser = req.user;
    return this.adminService.transitionBooking(bookingId, dto.next, dto.notes, admin.id);
  }

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}