import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
    enum: ['initiated', 'processed', 'failed'],
    default: 'initiated',
  })
  status: string;

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;
}

// -- Payment document ----------------------------------------------------------
export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true })
  order: Types.ObjectId;

  @Prop({ type: Number, required: true }) // paise — must match Order.totalAmount
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
PaymentSchema.index({ order: 1 }, { unique: true });
PaymentSchema.index({ razorpayOrderId: 1 }, { unique: true });
PaymentSchema.index({ razorpayPaymentId: 1 }, { unique: true, sparse: true });
