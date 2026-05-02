import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, Service } from '../../common/database/database.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ServicesRepository {
  constructor(private readonly db: DatabaseService) {}

  findAll(): Service[] {
    return this.db.services;
  }

  findById(id: string): Service {
    const service = this.db.services.find(
      (row) => row.service_id === id,
    );
    if (!service) {
      throw new NotFoundException(`Service with id "${id}" not found`);
    }
    return service;
  }

  findByCategory(categoryId: string): Service[] {
    return this.db.services.filter(
      (row) => row.category_id === categoryId,
    );
  }

  findAvailable(): Service[] {
    return this.db.services.filter(
      (row) => row.is_available === true,
    );
  }

  create(dto: CreateServiceDto): Service {
    const service: Service = {
      service_id: randomUUID(),
      service_name: dto.service_name,
      description: dto.description || '',
      image_url: dto.image_url || '',
      base_price: dto.base_price,
      estimated_duration_min: dto.estimated_duration_min,
      average_rating: 0,
      rating_count: 0,
      is_available: true,
      category_id: dto.category_id,
    };
    this.db.services.push(service);
    return service;
  }

  update(id: string, dto: UpdateServiceDto): Service {
    const service = this.findById(id);

    if (dto.service_name !== undefined) service.service_name = dto.service_name;
    if (dto.description !== undefined) service.description = dto.description;
    if (dto.image_url !== undefined) service.image_url = dto.image_url;
    if (dto.base_price !== undefined) service.base_price = dto.base_price;
    if (dto.estimated_duration_min !== undefined) service.estimated_duration_min = dto.estimated_duration_min;
    if (dto.category_id !== undefined) service.category_id = dto.category_id;

    return service;
  }

  delete(id: string): Service {
    const index = this.db.services.findIndex(
      (row) => row.service_id === id,
    );
    if (index < 0) {
      throw new NotFoundException(`Service with id "${id}" not found`);
    }
    const [removed] = this.db.services.splice(index, 1);
    return removed;
  }
}
