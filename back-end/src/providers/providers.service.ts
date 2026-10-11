import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Provider, ProviderDocument } from '../schema/provider.schema';
import { ProviderStatus } from '../common/enums';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
  ) {}

  create(dto: CreateProviderDto) {
    return new this.providerModel(dto).save();
  }

  findAll() {
    return this.providerModel.find().populate('user', '-password').exec();
  }

  async findOne(id: string) {
    const doc = await this.providerModel
      .findById(id)
      .populate('user', '-password')
      .exec();
    if (!doc) throw new NotFoundException(`Provider ${id} not found`);
    return doc;
  }

  findByUser(userId: string) {
    return this.providerModel.findOne({ user: userId }).exec();
  }

  findByRegion(regionId: string, status?: ProviderStatus | string) {
    const filter: Record<string, unknown> = { region: regionId };
    if (status) {
      filter.status = status as ProviderStatus;
    }
    return this.providerModel.find(filter).exec();
  }

  findByStatus(status: ProviderStatus | string) {
    return this.providerModel.find({ status: status as ProviderStatus }).exec();
  }

  findByService(serviceId: string) {
    return this.providerModel.find({ offeredServices: serviceId }).exec();
  }

  async update(id: string, dto: UpdateProviderDto) {
    const doc = await this.providerModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException(`Provider ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.providerModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Provider ${id} not found`);
    return doc;
  }
}
