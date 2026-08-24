import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class SavedPaymentMethod {
  // Razorpay Customer this token belongs to
  @Prop({ required: true })
  razorpayCustomerId!: string;

  // Razorpay Token — used to charge the saved card/UPI/etc. on future orders
  @Prop({ required: true })
  razorpayTokenId!: string;

  // Card brand: like Visa or MasterCard
  @Prop({ required: true })
  brand!: string;

  @Prop({ required: true })
  last4!: string;
}

export const SavedPaymentMethodSchema =
  SchemaFactory.createForClass(SavedPaymentMethod);
