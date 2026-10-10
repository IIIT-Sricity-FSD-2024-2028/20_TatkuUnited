import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Region, RegionDocument } from '../schema/region.schema';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionsService {
  constructor(
    @InjectModel(Region.name) private readonly regionModel: Model<RegionDocument>,
  ) {}

  create(dto: CreateRegionDto) {
    return new this.regionModel(dto).save();
  }

  findAll() {
    return this.regionModel.find().populate('manager').exec();
  }

  findActive() {
    return this.regionModel.find({ isActive: true }).exec();
  }

  async findOne(id: string) {
    const doc = await this.regionModel.findById(id).populate('manager').exec();
    if (!doc) throw new NotFoundException(`Region ${id} not found`);
    return doc;
  }

  async update(id: string, dto: UpdateRegionDto) {
    const doc = await this.regionModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException(`Region ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.regionModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Region ${id} not found`);
    return doc;
  }
}
