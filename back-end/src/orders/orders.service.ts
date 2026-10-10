import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schema/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  create(dto: CreateOrderDto) {
    return new this.orderModel(dto).save();
  }

  findAll() {
    return this.orderModel.find().exec();
  }

  findByCustomer(customerId: string) {
    return this.orderModel
      .find({ customer: customerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const doc = await this.orderModel.findById(id).exec();
    if (!doc) throw new NotFoundException(`Order ${id} not found`);
    return doc;
  }

  async update(id: string, dto: UpdateOrderDto) {
    const doc = await this.orderModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException(`Order ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.orderModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Order ${id} not found`);
    return doc;
  }
}
