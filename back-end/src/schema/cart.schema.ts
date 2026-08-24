import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.schema';
import { CartItem, CartItemSchema } from './common/cart-item.schema';
import { CartStatus } from './common/enums';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ timestamps: { createdAt: false, updatedAt: true } })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  customer!: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items!: CartItem[];

  @Prop({ type: String, enum: CartStatus, default: CartStatus.ACTIVE })
  status!: CartStatus;

  // updatedAt is added automatically via the `timestamps` option above
  updatedAt?: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
