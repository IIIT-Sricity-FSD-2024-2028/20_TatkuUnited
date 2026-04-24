import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, UnitManager } from '../../common/database/database.service';
import { CreateUnitManagerDto } from './dto/create-unit-manager.dto';
import { UpdateUnitManagerDto } from './dto/update-unit-manager.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UnitManagersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): UnitManager[] {
    return this.databaseService.unitManagers;
  }

  findById(id: string): UnitManager {
    const manager = this.databaseService.unitManagers.find(
      (row) => row.um_id === id,
    );
    if (!manager) {
      throw new NotFoundException(`UnitManager with id "${id}" not found`);
    }
    return manager;
  }

  findByUnit(unitId: string): UnitManager[] {
    return this.databaseService.unitManagers.filter(
      (row) => row.unit_id === unitId,
    );
  }

  create(dto: CreateUnitManagerDto): UnitManager {
    const manager: UnitManager = {
      um_id: uuid(),
      name: dto.name,
      email: dto.email,
      password_hash: this.databaseService.storePassword(dto.password),
      phone: dto.phone,
      is_active: dto.is_active,
      unit_id: dto.unit_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    this.databaseService.unitManagers.push(manager);
    return manager;
  }

  update(id: string, dto: UpdateUnitManagerDto): UnitManager {
    const manager = this.findById(id);
    
    if (dto.password) {
      manager.password_hash = this.databaseService.storePassword(dto.password);
    }
    if (dto.name !== undefined) manager.name = dto.name;
    if (dto.email !== undefined) manager.email = dto.email;
    if (dto.phone !== undefined) manager.phone = dto.phone;
    if (dto.unit_id !== undefined) manager.unit_id = dto.unit_id;
    if (dto.is_active !== undefined) manager.is_active = dto.is_active;
    
    manager.updated_at = new Date().toISOString();
    return manager;
  }

  delete(id: string): UnitManager {
    const index = this.databaseService.unitManagers.findIndex(
      (row) => row.um_id === id,
    );
    if (index < 0) {
      throw new NotFoundException(`UnitManager with id "${id}" not found`);
    }
    const [removed] = this.databaseService.unitManagers.splice(index, 1);
    return removed;
  }
}
