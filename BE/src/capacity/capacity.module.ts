import { Module } from '@nestjs/common';
import { CapacityController } from './capacity.controller';
import { CapacityService } from './capacity.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [CapacityController],
  providers: [CapacityService],
  exports: [CapacityService],
})
export class CapacityModule {}