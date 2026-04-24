import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, Collective } from '../../common/database/database.service';
import { CreateCollectiveDto } from './dto/create-collective.dto';
import { UpdateCollectiveDto } from './dto/update-collective.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CollectivesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): Collective[] {
    return this.databaseService.collectives;
  }

  findById(id: string): Collective {
    const collective = this.databaseService.collectives.find(
      (row) => row.collective_id === id,
    );
    if (!collective) {
      throw new NotFoundException(`Collective with id "${id}" not found`);
    }
    return collective;
  }

  create(dto: CreateCollectiveDto): Collective {
    const collective: Collective = {
      collective_id: uuid(),
      collective_name: dto.collective_name,
      is_active: dto.is_active,
      created_at: new Date().toISOString(),
    };
    this.databaseService.collectives.push(collective);
    return collective;
  }

  update(id: string, dto: UpdateCollectiveDto): Collective {
    const collective = this.findById(id);
    Object.assign(collective, dto);
    return collective;
  }

  delete(id: string): Collective {
    const index = this.databaseService.collectives.findIndex(
      (row) => row.collective_id === id,
    );
    if (index < 0) {
      throw new NotFoundException(`Collective with id "${id}" not found`);
    }
    const [removed] = this.databaseService.collectives.splice(index, 1);
    return removed;
  }
}
