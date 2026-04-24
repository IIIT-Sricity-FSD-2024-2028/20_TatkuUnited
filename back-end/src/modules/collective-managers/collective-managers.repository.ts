import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, CollectiveManager } from '../../common/database/database.service';
import { CreateCollectiveManagerDto } from './dto/create-collective-manager.dto';
import { UpdateCollectiveManagerDto } from './dto/update-collective-manager.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CollectiveManagersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): CollectiveManager[] {
    return this.databaseService.collectiveManagers;
  }

  findById(id: string): CollectiveManager {
    const manager = this.databaseService.collectiveManagers.find(
      (row) => row.cm_id === id,
    );
    if (!manager) {
      throw new NotFoundException(`CollectiveManager with id "${id}" not found`);
    }
    return manager;
  }

  findByCollective(collectiveId: string): CollectiveManager[] {
    return this.databaseService.collectiveManagers.filter(
      (row) => row.collective_id === collectiveId,
    );
  }

  create(dto: CreateCollectiveManagerDto): CollectiveManager {
    const manager: CollectiveManager = {
      cm_id: uuid(),
      name: dto.name,
      email: dto.email,
      password_hash: this.databaseService.storePassword(dto.password),
      phone: dto.phone,
      is_active: dto.is_active,
      collective_id: dto.collective_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    this.databaseService.collectiveManagers.push(manager);
    return manager;
  }

  update(id: string, dto: UpdateCollectiveManagerDto): CollectiveManager {
    const manager = this.findById(id);
    
    if (dto.password) {
      manager.password_hash = this.databaseService.storePassword(dto.password);
    }
    if (dto.name !== undefined) manager.name = dto.name;
    if (dto.email !== undefined) manager.email = dto.email;
    if (dto.phone !== undefined) manager.phone = dto.phone;
    if (dto.collective_id !== undefined) manager.collective_id = dto.collective_id;
    if (dto.is_active !== undefined) manager.is_active = dto.is_active;
    
    manager.updated_at = new Date().toISOString();
    return manager;
  }

  delete(id: string): CollectiveManager {
    const index = this.databaseService.collectiveManagers.findIndex(
      (row) => row.cm_id === id,
    );
    if (index < 0) {
      throw new NotFoundException(`CollectiveManager with id "${id}" not found`);
    }
    const [removed] = this.databaseService.collectiveManagers.splice(index, 1);
    return removed;
  }
}
