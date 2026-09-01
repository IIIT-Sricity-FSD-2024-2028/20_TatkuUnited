import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, ServiceProvider } from '../../common/database/database.service';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { randomUUID } from 'crypto';

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
      (row) => row.email.toLowerCase() === email.toLowerCase(),
    );
  }

  findByRegion(regionId: string): ServiceProvider[] {
    return this.databaseService.serviceProviders.filter(
      (row) => row.region_id === regionId,
    );
  }

  findPending(): ServiceProvider[] {
    return this.databaseService.serviceProviders.filter(
      (row) => row.account_status === 'pending' || !row.region_id,
    );
  }

  create(dto: CreateServiceProviderDto): ServiceProvider {
    const provider: ServiceProvider = {
      sp_id: randomUUID(),
      name: dto.full_name,
      email: dto.email,
      password_hash: this.databaseService.storePassword(dto.password),
      phone: dto.phone,
      dob: '',
      address: '',
      city: dto.city || 'Chennai',
      gender: '',
      rating: 0,
      rating_count: 0,
      is_active: dto.is_active ?? false,
      account_status: dto.is_active ? 'active' : 'pending',
      deactivation_requested: false,
      hour_start: '07:00',
      hour_end: '23:00',
      created_at: this.databaseService.now(),
      updated_at: this.databaseService.now(),
      region_id: dto.region_id || null,
      service_category: dto.service_category || '',
      experience: dto.experience || '',
    };
    
    this.databaseService.serviceProviders.push(provider);
    this.databaseService.save();
    return provider;
  }

  approve(id: string, regionId: string): ServiceProvider {
    const provider = this.findById(id);
    provider.region_id = regionId;
    provider.account_status = 'active';
    provider.is_active = true;
    provider.updated_at = this.databaseService.now();
    this.databaseService.save();
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
    if (dto.city !== undefined) provider.city = dto.city;
    if (dto.region_id !== undefined) provider.region_id = dto.region_id;
    if (dto.is_active !== undefined) {
      provider.is_active = dto.is_active;
      provider.account_status = dto.is_active ? 'active' : 'inactive';
    }
    if (dto.service_category !== undefined) provider.service_category = dto.service_category;
    if (dto.experience !== undefined) provider.experience = dto.experience;

    if (dto.skills !== undefined) {
      this.databaseService.providerSkills = this.databaseService.providerSkills.filter(
        (ps) => ps.sp_id !== id,
      );
      for (const skillId of dto.skills) {
        this.databaseService.providerSkills.push({
          sp_id: id,
          skill_id: skillId,
          verification_status: 'Pending',
          verified_at: null,
        });
      }
    }

    provider.updated_at = this.databaseService.now();
    this.databaseService.save();
    return provider;
  }

  updateWorkingHours(id: string, dto: UpdateWorkingHoursDto): ServiceProvider {
    const provider = this.findById(id);
    provider.hour_start = dto.hour_start;
    provider.hour_end = dto.hour_end;
    provider.updated_at = this.databaseService.now();
    this.databaseService.save();
    return provider;
  }

  updateProfile(id: string, dto: UpdateProviderProfileDto): ServiceProvider {
    const provider = this.findById(id);
    if (dto.dob !== undefined) provider.dob = dto.dob;
    if (dto.address !== undefined) provider.address = dto.address;
    if (dto.gender !== undefined) provider.gender = dto.gender;
    provider.updated_at = this.databaseService.now();
    this.databaseService.save();
    return provider;
  }

  requestDeactivation(id: string): ServiceProvider {
    const provider = this.findById(id);
    provider.deactivation_requested = true;
    provider.updated_at = this.databaseService.now();
    this.databaseService.save();
    return provider;
  }

  delete(id: string): boolean {
    const index = this.databaseService.serviceProviders.findIndex(
      (p) => p.sp_id === id,
    );
    if (index === -1) return false;
    this.databaseService.serviceProviders.splice(index, 1);
    this.databaseService.save();
    return true;
  }
}
