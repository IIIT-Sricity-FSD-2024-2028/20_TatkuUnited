import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AddressSnapshot } from './common';
import { PaymentStatus } from '../common/enums';

// -- Order document ------------------------------------------------------------
export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customer: Types.ObjectId;

  @Prop({ type: AddressSnapshot, required: true })
  address: AddressSnapshot; // snapshot - never update after creation

  @Prop({ type: Number, required: true }) // paise
  totalAmount: number;

  @Prop({ type: Types.ObjectId, ref: 'Payment', default: null })
  payment: Types.ObjectId | null;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.CREATED,
  })
  paymentStatus: PaymentStatus;

  @Prop({ type: Date, required: true }) // order creation + 15 min
  expiresAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// -- Indexes -------------------------------------------------------------------
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, expiresAt: 1 }); // expiry sweep
