import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../schema/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  create(dto: CreatePaymentDto) {
    return new this.paymentModel(dto).save();
  }

  findAll() {
    return this.paymentModel.find().exec();
  }

  async findOne(id: string) {
    const doc = await this.paymentModel.findById(id).exec();
    if (!doc) throw new NotFoundException(`Payment ${id} not found`);
    return doc;
  }

  findByOrder(orderId: string) {
    return this.paymentModel.findOne({ order: orderId }).exec();
  }

  /** Used by Razorpay webhook to look up the payment. */
  findByRazorpayOrderId(razorpayOrderId: string) {
    return this.paymentModel.findOne({ razorpayOrderId }).exec();
  }

  async update(id: string, dto: UpdatePaymentDto) {
    const doc = await this.paymentModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException(`Payment ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.paymentModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Payment ${id} not found`);
    return doc;
  }
}
