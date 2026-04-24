import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, ProviderUnavailability } from '../../common/database/database.service';
import { CreateProviderUnavailabilityDto } from './dto/create-provider-unavailability.dto';
import { UpdateProviderUnavailabilityDto } from './dto/update-provider-unavailability.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ProviderUnavailabilityRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): ProviderUnavailability[] {
    return this.databaseService.providerUnavailability;
  }

  findById(id: string): ProviderUnavailability {
    const record = this.databaseService.providerUnavailability.find(
      (row) => row.unavailability_id === id,
    );
    if (!record) {
      throw new NotFoundException(`ProviderUnavailability with id "${id}" not found`);
    }
    return record;
  }

  findByProvider(providerId: string): ProviderUnavailability[] {
    return this.databaseService.providerUnavailability.filter(
      (row) => row.sp_id === providerId,
    );
  }

  create(dto: CreateProviderUnavailabilityDto): ProviderUnavailability {
    const record: ProviderUnavailability = {
      unavailability_id: uuid(),
      date: null,
      hour_start: dto.start_time,
      hour_end: dto.end_time,
      reason: dto.reason || '',
      is_recurring: false,
      created_at: new Date().toISOString(),
      sp_id: dto.provider_id,
    };
    this.databaseService.providerUnavailability.push(record);
    return record;
  }

  update(id: string, dto: UpdateProviderUnavailabilityDto): ProviderUnavailability {
    const record = this.findById(id);
    
    if (dto.provider_id !== undefined) record.sp_id = dto.provider_id;
    if (dto.start_time !== undefined) record.hour_start = dto.start_time;
    if (dto.end_time !== undefined) record.hour_end = dto.end_time;
    if (dto.reason !== undefined) record.reason = dto.reason;
    
    return record;
  }

  delete(id: string): ProviderUnavailability {
    const index = this.databaseService.providerUnavailability.findIndex(
      (row) => row.unavailability_id === id,
    );
    if (index < 0) {
      throw new NotFoundException(`ProviderUnavailability with id "${id}" not found`);
    }
    const [removed] = this.databaseService.providerUnavailability.splice(index, 1);
    return removed;
  }
}
