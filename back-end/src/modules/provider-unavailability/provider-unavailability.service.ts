import { Injectable } from '@nestjs/common';
import { CreateProviderUnavailabilityDto } from './dto/create-provider-unavailability.dto';
import { UpdateProviderUnavailabilityDto } from './dto/update-provider-unavailability.dto';

@Injectable()
export class ProviderUnavailabilityService {
  create(createProviderUnavailabilityDto: CreateProviderUnavailabilityDto) {
    return 'This action adds a new providerUnavailability';
  }

  findAll() {
    return `This action returns all providerUnavailability`;
  }

  findOne(id: number) {
    return `This action returns a #${id} providerUnavailability`;
  }

  update(id: number, updateProviderUnavailabilityDto: UpdateProviderUnavailabilityDto) {
    return `This action updates a #${id} providerUnavailability`;
  }

  remove(id: number) {
    return `This action removes a #${id} providerUnavailability`;
  }
}
