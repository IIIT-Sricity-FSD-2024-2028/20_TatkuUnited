import { Injectable } from '@nestjs/common';
import { CollectivesRepository } from './collectives.repository';
import { CreateCollectiveDto } from './dto/create-collective.dto';
import { UpdateCollectiveDto } from './dto/update-collective.dto';
import { SectorsService } from '../sectors/sectors.service';

@Injectable()
export class CollectivesService {
  constructor(
    private readonly collectivesRepository: CollectivesRepository,
    private readonly sectorsService: SectorsService,
  ) {}

  findAll() {
    return this.collectivesRepository.findAll();
  }

  findOne(id: string) {
    return this.collectivesRepository.findById(id);
  }

  async create(dto: CreateCollectiveDto) {
    const collective = this.collectivesRepository.create(dto);
    if (dto.sector_ids && dto.sector_ids.length > 0) {
      await Promise.all(
        dto.sector_ids.map((sectorId) =>
          this.sectorsService.update(sectorId, {
            collective_id: collective.collective_id,
          }),
        ),
      );
    }
    return collective;
  }

  async update(id: string, dto: UpdateCollectiveDto) {
    const collective = this.collectivesRepository.update(id, dto);
    if (dto.sector_ids) {
      // Unassign old sectors first (optional, but good for consistency)
      const oldSectors = await this.sectorsService.findByCollective(id);
      await Promise.all(
        oldSectors.map((s) =>
          this.sectorsService.update(s.sector_id, { collective_id: '' }),
        ),
      );

      // Assign new sectors
      if (dto.sector_ids.length > 0) {
        await Promise.all(
          dto.sector_ids.map((sectorId) =>
            this.sectorsService.update(sectorId, { collective_id: id }),
          ),
        );
      }
    }
    return collective;
  }

  remove(id: string) {
    return this.collectivesRepository.delete(id);
  }
}
