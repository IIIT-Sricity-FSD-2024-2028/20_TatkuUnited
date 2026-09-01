import { Injectable } from '@nestjs/common';
import { DatabaseService, RegionManager } from '../../common/database/database.service';
import { CreateRegionManagerDto } from './dto/create-region-manager.dto';
import { UpdateRegionManagerDto } from './dto/update-region-manager.dto';

@Injectable()
export class RegionManagersRepository {
  constructor(private readonly db: DatabaseService) {}

  findAll(): RegionManager[] {
    return this.db.regionManagers;
  }

  findById(id: string): RegionManager | undefined {
    return this.db.regionManagers.find((rm) => rm.rm_id === id);
  }

  findByEmail(email: string): RegionManager | undefined {
    return this.db.regionManagers.find((rm) => rm.email.toLowerCase() === email.toLowerCase());
  }

  findByRegion(regionId: string): RegionManager[] {
    return this.db.regionManagers.filter((rm) => rm.region_id === regionId);
  }

  create(dto: CreateRegionManagerDto): RegionManager {
    const rm: RegionManager = {
      rm_id: this.db.genId(),
      name: dto.name,
      email: dto.email,
      password_hash: this.db.storePassword(dto.password),
      phone: dto.phone,
      is_active: dto.is_active ?? true,
      created_at: this.db.now(),
      updated_at: this.db.now(),
      region_id: dto.region_id,
    };
    this.db.regionManagers.push(rm);
    this.db.save();
    return rm;
  }

  update(id: string, dto: UpdateRegionManagerDto): RegionManager | undefined {
    const rm = this.findById(id);
    if (!rm) return undefined;
    if (dto.name !== undefined) rm.name = dto.name;
    if (dto.email !== undefined) rm.email = dto.email;
    if (dto.password !== undefined) rm.password_hash = this.db.storePassword(dto.password);
    if (dto.phone !== undefined) rm.phone = dto.phone;
    if (dto.region_id !== undefined) rm.region_id = dto.region_id;
    if (dto.is_active !== undefined) rm.is_active = dto.is_active;
    rm.updated_at = this.db.now();
    this.db.save();
    return rm;
  }

  delete(id: string): boolean {
    const idx = this.db.regionManagers.findIndex((rm) => rm.rm_id === id);
    if (idx === -1) return false;
    this.db.regionManagers.splice(idx, 1);
    this.db.save();
    return true;
  }
}
