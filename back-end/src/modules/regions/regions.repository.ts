import { Injectable } from '@nestjs/common';
import { DatabaseService, Region } from '../../common/database/database.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionsRepository {
  constructor(private readonly db: DatabaseService) {}

  findAll(): Region[] {
    return this.db.regions;
  }

  findById(id: string): Region | undefined {
    return this.db.regions.find((r) => r.region_id === id);
  }

  create(dto: CreateRegionDto): Region {
    const region: Region = {
      region_id: this.db.genId(),
      region_name: dto.region_name,
      is_active: dto.is_active ?? true,
      created_at: this.db.now(),
    };
    this.db.regions.push(region);
    this.db.save();
    return region;
  }

  update(id: string, dto: UpdateRegionDto): Region | undefined {
    const region = this.findById(id);
    if (!region) return undefined;
    if (dto.region_name !== undefined) region.region_name = dto.region_name;
    if (dto.is_active !== undefined) region.is_active = dto.is_active;
    this.db.save();
    return region;
  }

  delete(id: string): boolean {
    const idx = this.db.regions.findIndex((r) => r.region_id === id);
    if (idx === -1) return false;
    this.db.regions.splice(idx, 1);
    this.db.save();
    return true;
  }
}
