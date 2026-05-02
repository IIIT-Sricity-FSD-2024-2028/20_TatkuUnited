import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, Category } from '../../common/database/database.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly db: DatabaseService) {}

  findAll(): Category[] {
    return this.db.categories;
  }

  findById(id: string): Category {
    const category = this.db.categories.find(
      (row) => row.category_id === id,
    );
    if (!category) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }
    return category;
  }

  create(dto: CreateCategoryDto): Category {
    const category: Category = {
      category_id: randomUUID(),
      category_name: dto.category_name,
      description: dto.description || '',
      icon: dto.icon || '',
      image_url: dto.image_url || '',
      average_rating: 0,
      rating_count: 0,
      is_available: true,
    };
    this.db.categories.push(category);
    return category;
  }

  update(id: string, dto: UpdateCategoryDto): Category {
    const category = this.findById(id);

    if (dto.category_name !== undefined) category.category_name = dto.category_name;
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.icon !== undefined) category.icon = dto.icon;
    if (dto.image_url !== undefined) category.image_url = dto.image_url;

    return category;
  }

  delete(id: string): Category {
    const index = this.db.categories.findIndex(
      (row) => row.category_id === id,
    );
    if (index < 0) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }
    const [removed] = this.db.categories.splice(index, 1);
    return removed;
  }
}
