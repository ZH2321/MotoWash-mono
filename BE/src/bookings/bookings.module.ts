import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AuthModule } from '../auth/auth.module';
import { CapacityModule } from '../capacity/capacity.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [AuthModule, CapacityModule, SettingsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}