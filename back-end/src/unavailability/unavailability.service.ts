import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Unavailability,
  UnavailabilityDocument,
} from '../schema/unavailability.schema';
import { Provider, ProviderDocument } from '../schema/provider.schema';
import { CreateUnavailabilityDto } from './dto/create-unavailability.dto';
import { UpdateUnavailabilityDto } from './dto/update-unavailability.dto';

@Injectable()
export class UnavailabilityService {
  constructor(
    @InjectModel(Unavailability.name)
    private readonly unavailabilityModel: Model<UnavailabilityDocument>,
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
  ) {}

  create(dto: CreateUnavailabilityDto) {
    return new this.unavailabilityModel(dto).save();
  }

  findAll() {
    return this.unavailabilityModel.find().populate('provider').exec();
  }

  findByProviderAndDate(providerId: string, date: Date) {
    const provider = Types.ObjectId.isValid(providerId)
      ? new Types.ObjectId(providerId)
      : providerId;
    return this.unavailabilityModel.find({ provider, date }).exec();
  }

  async findByProvider(providerId: string, date?: string) {
    let actualProviderId = providerId;
    if (Types.ObjectId.isValid(providerId)) {
      const providerDoc = await this.providerModel
        .findOne({
          $or: [
            { _id: new Types.ObjectId(providerId) },
            { user: new Types.ObjectId(providerId) },
          ],
        })
        .exec();
      if (providerDoc) {
        actualProviderId = providerDoc._id.toString();
      }
    }

    const provider = Types.ObjectId.isValid(actualProviderId)
      ? new Types.ObjectId(actualProviderId)
      : actualProviderId;
    const filter: Record<string, unknown> = { provider };
    if (date) {
      const queryDate = new Date(date);
      if (!isNaN(queryDate.getTime())) {
        filter.date = queryDate;
      }
    }

    return this.unavailabilityModel
      .find(filter)
      .sort({ date: 1, startTime: 1 })
      .populate('provider')
      .exec();
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
