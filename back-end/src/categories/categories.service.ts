import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schema/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  create(dto: CreateCategoryDto) {
    return new this.categoryModel(dto).save();
  }

  findAll() {
    return this.categoryModel.find().exec();
  }

  findActive() {
    return this.categoryModel.find({ isActive: true }).exec();
  }

  async findOne(id: string) {
    const doc = await this.categoryModel.findById(id).exec();
    if (!doc) throw new NotFoundException(`Category ${id} not found`);
    return doc;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const doc = await this.categoryModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException(`Category ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Category ${id} not found`);
    return doc;
  }
}
