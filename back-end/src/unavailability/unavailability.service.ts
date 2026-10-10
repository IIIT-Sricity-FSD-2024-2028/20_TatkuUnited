import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Unavailability,
  UnavailabilityDocument,
} from '../schema/unavailability.schema';
import { CreateUnavailabilityDto } from './dto/create-unavailability.dto';
import { UpdateUnavailabilityDto } from './dto/update-unavailability.dto';

@Injectable()
export class UnavailabilityService {
  constructor(
    @InjectModel(Unavailability.name)
    private readonly unavailabilityModel: Model<UnavailabilityDocument>,
  ) {}

  create(dto: CreateUnavailabilityDto) {
    return new this.unavailabilityModel(dto).save();
  }

  findAll() {
    return this.unavailabilityModel.find().exec();
  }

  findByProviderAndDate(providerId: string, date: Date) {
    return this.unavailabilityModel.find({ provider: providerId, date }).exec();
  }

  async findOne(id: string) {
    const doc = await this.unavailabilityModel.findById(id).exec();
    if (!doc)
      throw new NotFoundException(`Unavailability record ${id} not found`);
    return doc;
  }

  async update(id: string, dto: UpdateUnavailabilityDto) {
    const doc = await this.unavailabilityModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc)
      throw new NotFoundException(`Unavailability record ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.unavailabilityModel.findByIdAndDelete(id).exec();
    if (!doc)
      throw new NotFoundException(`Unavailability record ${id} not found`);
    return doc;
  }
}
