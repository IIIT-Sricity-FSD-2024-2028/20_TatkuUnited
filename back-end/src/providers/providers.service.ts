import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    const user = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : userId;
    return this.providerModel.findOne({ user }).populate('user', '-password').exec();
  }

  findByRegion(regionId: string, status?: ProviderStatus | string) {
    const region = Types.ObjectId.isValid(regionId)
      ? new Types.ObjectId(regionId)
      : regionId;
    const filter: Record<string, unknown> = { region };
    if (status) {
      filter.status = status;
    }
    return this.providerModel.find(filter).populate('user', '-password').exec();
  }

  findByStatus(status: ProviderStatus | string) {
    return this.providerModel.find({ status: status as ProviderStatus }).populate('user', '-password').exec();
  }

  findByService(serviceId: string) {
    const service = Types.ObjectId.isValid(serviceId)
      ? new Types.ObjectId(serviceId)
      : serviceId;
    return this.providerModel.find({ offeredServices: service }).populate('user', '-password').exec();
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
