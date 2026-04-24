import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, Sector } from '../../common/database/database.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class SectorsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): Sector[] {
    return this.databaseService.sectors;
  }

  findById(id: string): Sector {
    const sector = this.databaseService.sectors.find(
      (row) => row.sector_id === id,
    );
    if (!sector) {
      throw new NotFoundException(`Sector with id "${id}" not found`);
    }
    return sector;
  }

  findByCollective(collectiveId: string): Sector[] {
    return this.databaseService.sectors.filter(
      (row) => row.collective_id === collectiveId,
    );
  }

  create(dto: CreateSectorDto): Sector {
    const sector: Sector = {
      sector_id: uuid(),
      sector_name: dto.sector_name,
      state: dto.state,
      region: dto.region,
      density_tier: dto.density_tier,
      is_active: dto.is_active,
      collective_id: dto.collective_id,
    };
    this.databaseService.sectors.push(sector);
    return sector;
  }

  update(id: string, dto: UpdateSectorDto): Sector {
    const sector = this.findById(id);
    Object.assign(sector, dto);
    return sector;
  }

  delete(id: string): Sector {
    const index = this.databaseService.sectors.findIndex(
      (row) => row.sector_id === id,
    );
    if (index < 0) {
      throw new NotFoundException(`Sector with id "${id}" not found`);
    }
    const [removed] = this.databaseService.sectors.splice(index, 1);
    return removed;
  }
}
