import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RefundStatus } from '../common/enums';

// -- Embedded: Refund entry inside Payment.refunds[] --------------------------
@Schema({ _id: false })
export class RefundEntry {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  booking: Types.ObjectId;

  @Prop({ type: Number, required: true }) // paise
  amount: number;

  @Prop({ type: String, required: true })
  razorpayRefundId: string;

  @Prop({
    type: String,
    enum: Object.values(RefundStatus),
    default: RefundStatus.INITIATED,
  })
  status: RefundStatus;

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;
}

// -- Payment document ----------------------------------------------------------
export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true })
  order: Types.ObjectId;

  @Prop({ type: Number, required: true }) // paise - must match Order.totalAmount
  totalAmount: number;

  @Prop({ type: String, default: 'INR' })
  currency: string;

  @Prop({ type: String, required: true, unique: true })
  razorpayOrderId: string;

  @Prop({ type: String, default: null })
  razorpayPaymentId: string | null;

  @Prop({ type: String, default: null })
  razorpaySignature: string | null;

  @Prop({ type: [RefundEntry], default: [] })
  refunds: RefundEntry[];
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// -- Indexes ----------------------------------------------------------------
PaymentSchema.index({ razorpayPaymentId: 1 }, { unique: true, sparse: true });
