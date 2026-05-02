import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  findAll() {
    return this.categoriesRepository.findAll();
  }

  findOne(id: string) {
    return this.categoriesRepository.findById(id);
  }

  create(dto: CreateCategoryDto) {
    return this.categoriesRepository.create(dto);
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.categoriesRepository.update(id, dto);
  }

  remove(id: string) {
    return this.categoriesRepository.delete(id);
  }
}
