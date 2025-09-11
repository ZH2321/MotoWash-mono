import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TtlService } from './ttl.service';
import { CapacityModule } from '../capacity/capacity.module';

@Module({
  imports: [ScheduleModule, CapacityModule],
  providers: [TtlService],
  exports: [TtlService],
})
export class JobsModule {}