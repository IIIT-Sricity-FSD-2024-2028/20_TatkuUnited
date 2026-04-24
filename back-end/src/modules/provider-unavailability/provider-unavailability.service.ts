import { Injectable } from '@nestjs/common';
import { ProviderUnavailabilityRepository } from './provider-unavailability.repository';
import { CreateProviderUnavailabilityDto } from './dto/create-provider-unavailability.dto';
import { UpdateProviderUnavailabilityDto } from './dto/update-provider-unavailability.dto';

@Injectable()
export class ProviderUnavailabilityService {
  constructor(private readonly providerUnavailabilityRepository: ProviderUnavailabilityRepository) {}

  findAll() {
    return this.providerUnavailabilityRepository.findAll();
  }

  findOne(id: string) {
    return this.providerUnavailabilityRepository.findById(id);
  }

  findByProvider(providerId: string) {
    return this.providerUnavailabilityRepository.findByProvider(providerId);
  }

  create(dto: CreateProviderUnavailabilityDto) {
    return this.providerUnavailabilityRepository.create(dto);
  }

  update(id: string, dto: UpdateProviderUnavailabilityDto) {
    return this.providerUnavailabilityRepository.update(id, dto);
  }

  remove(id: string) {
    return this.providerUnavailabilityRepository.delete(id);
  }
}
