import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service, ServiceDocument } from '../schema/service.schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  create(dto: CreateServiceDto) {
    return new this.serviceModel(dto).save();
  }

  findAll(categoryId?: string) {
    const filter: Record<string, unknown> = { isActive: true };
    if (categoryId) filter.category = categoryId;
    return this.serviceModel.find(filter).populate('category').exec();
  }

  async findOne(id: string) {
    const doc = await this.serviceModel
      .findById(id)
      .populate('category')
      .exec();
    if (!doc) throw new NotFoundException(`Service ${id} not found`);
    return doc;
  }

  async update(id: string, dto: UpdateServiceDto) {
    const doc = await this.serviceModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException(`Service ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.serviceModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Service ${id} not found`);
    return doc;
  }
}
