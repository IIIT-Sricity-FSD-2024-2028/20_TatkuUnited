import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, Unit } from '../../common/database/database.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UnitsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): Unit[] {
    return this.databaseService.units;
  }

  findById(id: string): Unit {
    const unit = this.databaseService.units.find(
      (row) => row.unit_id === id,
    );
    if (!unit) {
      throw new NotFoundException(`Unit with id "${id}" not found`);
    }
    return unit;
  }

  findByCollective(collectiveId: string): Unit[] {
    return this.databaseService.units.filter(
      (row) => row.collective_id === collectiveId,
    );
  }

  create(dto: CreateUnitDto): Unit {
    const unit: Unit = {
      unit_id: uuid(),
      unit_name: dto.unit_name,
      rating: 0,
      rating_count: 0,
      is_active: dto.is_active,
      created_at: new Date().toISOString(),
      collective_id: dto.collective_id,
    };
    this.databaseService.units.push(unit);
    return unit;
  }

  update(id: string, dto: UpdateUnitDto): Unit {
    const unit = this.findById(id);
    Object.assign(unit, dto);
    return unit;
  }

  delete(id: string): Unit {
    const index = this.databaseService.units.findIndex(
      (row) => row.unit_id === id,
    );
    if (index < 0) {
      throw new NotFoundException(`Unit with id "${id}" not found`);
    }
    const [removed] = this.databaseService.units.splice(index, 1);
    return removed;
  }
}
