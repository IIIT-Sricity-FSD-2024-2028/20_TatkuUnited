import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { DatabaseService } from '../../common/database/database.service';

@Injectable()
export class UnitsService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(createUnitDto: CreateUnitDto) {
    return createUnitDto;
  }

  findAll() {
    return this.databaseService.units;
  }

  findOne(id: string) {
    const unit = this.databaseService.units.find((row) => row.unit_id === id);
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    return unit;
  }

  update(id: string, updateUnitDto: UpdateUnitDto) {
    const unit = this.databaseService.units.find((row) => row.unit_id === id);
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    Object.assign(unit, updateUnitDto);
    return unit;
  }

  remove(id: string) {
    const index = this.databaseService.units.findIndex((row) => row.unit_id === id);
    if (index < 0) {
      throw new NotFoundException('Unit not found');
    }

    const [removed] = this.databaseService.units.splice(index, 1);
    return removed;
  }
}
