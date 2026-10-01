import { Injectable } from '@nestjs/common';
import { UnitsRepository } from './units.repository';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly unitsRepository: UnitsRepository) {}

  findAll() {
    return this.unitsRepository.findAll();
  }

  findOne(id: string) {
    return this.unitsRepository.findById(id);
  }

  findByCollective(collectiveId: string) {
    return this.unitsRepository.findByCollective(collectiveId);
  }

  create(dto: CreateUnitDto) {
    return this.unitsRepository.create(dto);
  }

  update(id: string, dto: UpdateUnitDto) {
    return this.unitsRepository.update(id, dto);
  }

  remove(id: string) {
    return this.unitsRepository.delete(id);
  }
}
