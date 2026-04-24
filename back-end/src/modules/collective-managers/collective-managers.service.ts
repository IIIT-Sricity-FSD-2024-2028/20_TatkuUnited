import { Injectable } from '@nestjs/common';
import { CollectiveManagersRepository } from './collective-managers.repository';
import { CreateCollectiveManagerDto } from './dto/create-collective-manager.dto';
import { UpdateCollectiveManagerDto } from './dto/update-collective-manager.dto';

@Injectable()
export class CollectiveManagersService {
  constructor(private readonly collectiveManagersRepository: CollectiveManagersRepository) {}

  findAll() {
    return this.collectiveManagersRepository.findAll();
  }

  findOne(id: string) {
    return this.collectiveManagersRepository.findById(id);
  }

  findByCollective(collectiveId: string) {
    return this.collectiveManagersRepository.findByCollective(collectiveId);
  }

  create(dto: CreateCollectiveManagerDto) {
    return this.collectiveManagersRepository.create(dto);
  }

  update(id: string, dto: UpdateCollectiveManagerDto) {
    return this.collectiveManagersRepository.update(id, dto);
  }

  remove(id: string) {
    return this.collectiveManagersRepository.delete(id);
  }
}
