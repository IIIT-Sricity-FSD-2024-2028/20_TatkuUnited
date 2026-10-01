import { Injectable } from '@nestjs/common';
import { SectorsRepository } from './sectors.repository';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';

@Injectable()
export class SectorsService {
  constructor(private readonly sectorsRepository: SectorsRepository) {}

  findAll() {
    return this.sectorsRepository.findAll();
  }

  findOne(id: string) {
    return this.sectorsRepository.findById(id);
  }

  findByCollective(collectiveId: string) {
    return this.sectorsRepository.findByCollective(collectiveId);
  }

  create(dto: CreateSectorDto) {
    return this.sectorsRepository.create(dto);
  }

  update(id: string, dto: UpdateSectorDto) {
    return this.sectorsRepository.update(id, dto);
  }

  remove(id: string) {
    return this.sectorsRepository.delete(id);
  }
}
