import { Injectable } from '@nestjs/common';
import { CreateUnavailabilityDto } from './dto/create-unavailability.dto';
import { UpdateUnavailabilityDto } from './dto/update-unavailability.dto';

@Injectable()
export class UnavailabilityService {
  create(createUnavailabilityDto: CreateUnavailabilityDto) {
    return 'This action adds a new unavailability';
  }

  findAll() {
    return `This action returns all unavailability`;
  }

  findOne(id: number) {
    return `This action returns a #${id} unavailability`;
  }

  update(id: number, updateUnavailabilityDto: UpdateUnavailabilityDto) {
    return `This action updates a #${id} unavailability`;
  }

  remove(id: number) {
    return `This action removes a #${id} unavailability`;
  }
}
