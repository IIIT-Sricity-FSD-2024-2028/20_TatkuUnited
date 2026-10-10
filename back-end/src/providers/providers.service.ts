import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Provider, ProviderDocument } from '../schema/provider.schema';
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
