import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, ServiceProvider } from '../../common/database/database.service';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ServiceProvidersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): ServiceProvider[] {
    return this.databaseService.serviceProviders;
  }

  findById(id: string): ServiceProvider {
    const provider = this.databaseService.serviceProviders.find(
      (row) => row.sp_id === id,
    );
    if (!provider) {
      throw new NotFoundException(`ServiceProvider with id "${id}" not found`);
    }
    return provider;
  }

  findByEmail(email: string): ServiceProvider | undefined {
    return this.databaseService.serviceProviders.find(
      (row) => row.email === email,
    );
  }

  findByUnit(unitId: string): ServiceProvider[] {
    return this.databaseService.serviceProviders.filter(
      (row) => row.unit_id === unitId,
    );
  }

  findBySector(sectorId: string): ServiceProvider[] {
    return this.databaseService.serviceProviders.filter(
      (row) => row.home_sector_id === sectorId,
    );
  }

  create(dto: CreateServiceProviderDto): ServiceProvider {
    const provider = {
      sp_id: uuid(),
      name: dto.full_name,
      email: dto.email,
      password_hash: this.databaseService.storePassword(dto.password),
      phone: dto.phone,
      dob: '',
      address: '',
      gender: '',
      rating: 0,
      rating_count: 0,
      is_active: dto.is_active,
      account_status: dto.is_active ? 'active' : 'inactive',
      deactivation_requested: false,
      hour_start: '',
      hour_end: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      unit_id: dto.unit_id,
      home_sector_id: dto.sector_id,
    } as unknown as ServiceProvider;
    
    this.databaseService.serviceProviders.push(provider);
    return provider;
  }

  update(id: string, dto: UpdateServiceProviderDto): ServiceProvider {
    const provider = this.findById(id);
    
    if (dto.password) {
      provider.password_hash = this.databaseService.storePassword(dto.password);
    }
    if (dto.full_name !== undefined) provider.name = dto.full_name;
    if (dto.email !== undefined) provider.email = dto.email;
    if (dto.phone !== undefined) provider.phone = dto.phone;
    if (dto.unit_id !== undefined) provider.unit_id = dto.unit_id;
    if (dto.sector_id !== undefined) provider.home_sector_id = dto.sector_id;
    if (dto.is_active !== undefined) provider.is_active = dto.is_active;
    
    provider.updated_at = new Date().toISOString();
    return provider;
  }

  updateWorkingHours(id: string, dto: UpdateWorkingHoursDto): ServiceProvider {
    const provider = this.findById(id);
    provider.hour_start = dto.hour_start;
    provider.hour_end = dto.hour_end;
    provider.updated_at = new Date().toISOString();
    return provider;
  }

  updateProfile(id: string, dto: UpdateProviderProfileDto): ServiceProvider {
    const provider = this.findById(id);
    if (dto.name !== undefined) provider.name = dto.name;
    if (dto.address !== undefined) provider.address = dto.address;
    if (dto.phone !== undefined) provider.phone = dto.phone;
    if (dto.dob !== undefined) provider.dob = dto.dob;
    if (dto.gender !== undefined) provider.gender = dto.gender;
    provider.updated_at = new Date().toISOString();
    return provider;
  }

  requestDeactivation(id: string): ServiceProvider {
    const provider = this.findById(id);
    provider.deactivation_requested = true;
    provider.updated_at = new Date().toISOString();
    return provider;
  }

  delete(id: string): ServiceProvider {
    const index = this.databaseService.serviceProviders.findIndex(
      (row) => row.sp_id === id,
    );
    if (index < 0) {
      throw new NotFoundException(`ServiceProvider with id "${id}" not found`);
    }
    const [removed] = this.databaseService.serviceProviders.splice(index, 1);
    return removed;
  }
}
