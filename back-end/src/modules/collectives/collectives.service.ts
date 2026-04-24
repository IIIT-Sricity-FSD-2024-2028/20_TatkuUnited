import { Injectable } from '@nestjs/common';
import { CollectivesRepository } from './collectives.repository';
import { CreateCollectiveDto } from './dto/create-collective.dto';
import { UpdateCollectiveDto } from './dto/update-collective.dto';

@Injectable()
export class CollectivesService {
  constructor(private readonly collectivesRepository: CollectivesRepository) {}

  findAll() {
    return this.collectivesRepository.findAll();
  }

  findOne(id: string) {
    return this.collectivesRepository.findById(id);
  }

  create(dto: CreateCollectiveDto) {
    return this.collectivesRepository.create(dto);
  }

  update(id: string, dto: UpdateCollectiveDto) {
    return this.collectivesRepository.update(id, dto);
  }

  remove(id: string) {
    return this.collectivesRepository.delete(id);
  }
}
