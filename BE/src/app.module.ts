import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './settings/settings.module';
import { CapacityModule } from './capacity/capacity.module';
import { BookingsModule } from './bookings/bookings.module';
import { AdminModule } from './admin/admin.module';
import { LineModule } from './line/line.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    SettingsModule,
    CapacityModule,
    BookingsModule,
    AdminModule,
    LineModule,
    JobsModule,
  ],
})
export class AppModule {}