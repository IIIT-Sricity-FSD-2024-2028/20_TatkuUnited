import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Booking } from './booking.schema';
import { User } from './user.schema';
import { PaymentStatus, PayoutStatus } from './common/enums';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Payment {
  @Prop({
    type: Types.ObjectId,
    ref: Booking.name,
    required: true,
    unique: true,
    index: true,
  })
  booking!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  customer!: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  totalAmount!: number;

  @Prop({ required: true, default: 'inr' })
  currency!: string;

  @Prop({ required: true, min: 0 })
  providerShare!: number;

  @Prop({ required: true, min: 0 })
  platformShare!: number;

  @Prop({ required: true, min: 0 })
  providerFeePercent!: number;

  @Prop({ required: true, min: 0 })
  platformFeePercent!: number;

  // created up-front, before the customer pays
  @Prop()
  razorpayOrderId?: string;

  // set once Razorpay captures the payment against the order
  @Prop()
  razorpayPaymentId?: string;

  // HMAC signature returned on checkout success / webhook — verify before
  // trusting razorpayPaymentId, then you can drop or keep it for audit
  @Prop()
  razorpaySignature?: string;

  @Prop()
  razorpayRefundId?: string;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus!: PaymentStatus;

  @Prop({ type: String, enum: PayoutStatus, default: PayoutStatus.PENDING })
  payoutStatus!: PayoutStatus;

  @Prop()
  dispatchedAt?: Date;

  // createdAt is added automatically via the `timestamps` option above
  createdAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
