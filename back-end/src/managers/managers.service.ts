import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Manager, ManagerDocument } from '../schema/manager.schema';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';

@Injectable()
export class ManagersService {
  constructor(
    @InjectModel(Manager.name)
    private readonly managerModel: Model<ManagerDocument>,
  ) {}

  create(dto: CreateManagerDto) {
    return new this.managerModel(dto).save();
  }

  findAll() {
    return this.managerModel.find().populate('user', '-password').exec();
  }

  async findOne(id: string) {
    const doc = await this.managerModel
      .findById(id)
      .populate('user', '-password')
      .exec();
    if (!doc) throw new NotFoundException(`Manager ${id} not found`);
    return doc;
  }

  findByUser(userId: string) {
    const user = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : userId;
    return this.managerModel.findOne({ user }).populate('user', '-password').exec();
  }

  async update(id: string, dto: UpdateManagerDto) {
    const doc = await this.managerModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException(`Manager ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.managerModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Manager ${id} not found`);
    return doc;
  }
}
