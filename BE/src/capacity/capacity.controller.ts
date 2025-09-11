import { Controller, Get, Query } from '@nestjs/common';
import { IsDateString, IsOptional } from 'class-validator';
import { CapacityService, DayAvailability } from './capacity.service';

class AvailabilityQueryDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

@Controller('capacity')
export class CapacityController {
  constructor(private readonly capacityService: CapacityService) {}

  @Get('availability')
  async getAvailability(@Query() query: AvailabilityQueryDto): Promise<DayAvailability[]> {
    return this.capacityService.getAvailability(query.date, query.endDate);
  }
}