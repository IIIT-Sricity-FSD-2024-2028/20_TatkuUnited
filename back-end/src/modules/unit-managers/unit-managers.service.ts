import { Injectable } from '@nestjs/common';
import { UnitManagersRepository } from './unit-managers.repository';
import { CreateUnitManagerDto } from './dto/create-unit-manager.dto';
import { UpdateUnitManagerDto } from './dto/update-unit-manager.dto';

@Injectable()
export class UnitManagersService {
  constructor(private readonly unitManagersRepository: UnitManagersRepository) {}

  findAll() {
    return this.unitManagersRepository.findAll();
  }

  findOne(id: string) {
    return this.unitManagersRepository.findById(id);
  }

  findByUnit(unitId: string) {
    return this.unitManagersRepository.findByUnit(unitId);
  }

  create(dto: CreateUnitManagerDto) {
    return this.unitManagersRepository.create(dto);
  }

  update(id: string, dto: UpdateUnitManagerDto) {
    return this.unitManagersRepository.update(id, dto);
  }

  remove(id: string) {
    return this.unitManagersRepository.delete(id);
  }
}
