import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  create(dto: CreateUserDto) {
    return new this.userModel(dto).save();
  }

  findAll() {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string) {
    const doc = await this.userModel.findById(id).select('-password').exec();
    if (!doc) throw new NotFoundException(`User ${id} not found`);
    return doc;
  }

  /** Used by auth — returns the password hash. */
  findByEmail(email: string) {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async update(id: string, dto: UpdateUserDto) {
    const doc = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select('-password')
      .exec();
    if (!doc) throw new NotFoundException(`User ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.userModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`User ${id} not found`);
    return doc;
  }
}
