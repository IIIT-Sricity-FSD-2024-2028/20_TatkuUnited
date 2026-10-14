import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enums/roles.enum';
import { User, UserDocument } from '../schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateUserDto) {
    let password = dto.password;
    if (
      password &&
      !password.startsWith('$2a$') &&
      !password.startsWith('$2b$')
    ) {
      password = await bcrypt.hash(password, 10);
    }
    const created = new this.userModel({ ...dto, password });
    const saved = await created.save();
    const result = saved && typeof (saved as any).toObject === 'function'
      ? (saved as any).toObject()
      : { ...saved };
    delete result.password;
    return result;
  }

  findAll() {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string) {
    const doc = await this.userModel.findById(id).select('-password').exec();
    if (!doc) throw new NotFoundException(`User ${id} not found`);
    return doc;
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).select('+password').exec();
  }

  findByRole(role: Role | string) {
    return this.userModel
      .find({ role: role as Role })
      .select('-password')
      .exec();
  }

  async addAddress(userId: string, address: any) {
    const addressId = address.id || new Types.ObjectId().toString();
    const newAddress = { ...address, id: addressId };
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $push: { addresses: newAddress } },
        { new: true },
      )
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return user.addresses;
  }

  async removeAddress(userId: string, addressId: string) {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { addresses: { id: addressId } } },
        { new: true },
      )
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return user.addresses;
  }

  async getCart(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('cart.items.service')
      .select('cart')
      .exec();
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return user.cart;
  }

  async addToCart(userId: string, item: any) {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $push: { 'cart.items': item } },
        { new: true },
      )
      .populate('cart.items.service')
      .select('cart')
      .exec();
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return user.cart;
  }

  async removeFromCart(userId: string, itemIndex: number) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    if (user.cart && user.cart.items && user.cart.items.length > itemIndex) {
      user.cart.items.splice(itemIndex, 1);
      await user.save();
    }
    return user.cart;
  }

  async clearCart(userId: string) {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { 'cart.items': [], 'cart.address': null } },
        { new: true },
      )
      .select('cart')
      .exec();
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return user.cart;
  }

  async selectCartAddress(userId: string, addressId: string) {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { 'cart.address': addressId } },
        { new: true },
      )
      .select('cart')
      .exec();
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return user.cart;
  }

  async update(id: string, dto: UpdateUserDto) {
    const updatePayload: any = { ...dto };
    if (
      updatePayload.password &&
      !updatePayload.password.startsWith('$2a$') &&
      !updatePayload.password.startsWith('$2b$')
    ) {
      updatePayload.password = await bcrypt.hash(updatePayload.password, 10);
    }
    const doc = await this.userModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
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

