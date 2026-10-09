import { Injectable } from '@nestjs/common';
import { ServiceProvidersRepository } from './service-providers.repository';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { UnitsRepository } from '../units/units.repository';
import { ServiceProvider } from './entities/service-provider.entity';

@Injectable()
export class ServiceProvidersService {
  constructor(
    private readonly serviceProvidersRepository: ServiceProvidersRepository,
    private readonly unitsRepository: UnitsRepository,
  ) {}

  findAll() {
    return this.serviceProvidersRepository.findAll();
  }

  findOne(id: string) {
    return this.serviceProvidersRepository.findById(id);
  }

  findByEmail(email: string) {
    return this.serviceProvidersRepository.findByEmail(email);
  }

  findByUnit(unitId: string) {
    return this.serviceProvidersRepository.findByUnit(unitId);
  }

  findByCollective(collective_id: string) {
    const units = this.unitsRepository.findByCollective(collective_id);
    console.log(units);
    let providers: ServiceProvider[] = [];
    for(let unit in units) {
      providers.concat(this.serviceProvidersRepository.findByUnit(unit));
      console.log(providers);
    }
    return providers;
  }

  findBySector(sectorId: string) {
    return this.serviceProvidersRepository.findBySector(sectorId);
  }

  create(dto: CreateServiceProviderDto) {
    return this.serviceProvidersRepository.create(dto);
  }

  update(id: string, dto: UpdateServiceProviderDto) {
    return this.serviceProvidersRepository.update(id, dto);
  }

  updateWorkingHours(id: string, dto: UpdateWorkingHoursDto) {
    return this.serviceProvidersRepository.updateWorkingHours(id, dto);
  }

  updateProfile(id: string, dto: UpdateProviderProfileDto) {
    return this.serviceProvidersRepository.updateProfile(id, dto);
  }

  requestDeactivation(id: string) {
    return this.serviceProvidersRepository.requestDeactivation(id);
  }

  remove(id: string) {
    return this.serviceProvidersRepository.delete(id);
  }
}
