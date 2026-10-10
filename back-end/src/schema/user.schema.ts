import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserAddress } from './common';

// -- Embedded: Cart item inside User.cart.items[] -----------------------------
@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  service: Types.ObjectId;

  @Prop({ type: Date, required: true })
  scheduledDate: Date;

  @Prop({ type: Number, required: true }) // minutes from midnight
  startTime: number;

  @Prop({ type: Number, required: true }) // minutes from midnight
  endTime: number;
}

// -- Embedded: Cart ------------------------------------------------------------
@Schema({ _id: false })
export class Cart {
  @Prop({ type: String, default: null })
  address: string | null; // id of one entry in User.addresses

  @Prop({ type: [CartItem], default: [] })
  items: CartItem[];
}

// -- User document -------------------------------------------------------------
export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ type: String, required: true, select: false }) // never return in responses
  password: string;

  @Prop({ type: String, enum: ['male', 'female', 'other'] })
  gender: string;

  @Prop({ type: String, required: true, unique: true, trim: true })
  phone: string;

  @Prop({ type: Date })
  dob: Date;

  @Prop({
    type: String,
    enum: ['customer', 'provider', 'manager', 'admin'],
    required: true,
  })
  role: string;

  @Prop({
    type: String,
    enum: ['active', 'blocked'],
    default: 'active',
  })
  status: string;

  @Prop({ type: Cart, default: () => ({ address: null, items: [] }) })
  cart: Cart;

  @Prop({ type: [UserAddress], default: [] })
  addresses: UserAddress[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// -- Indexes -------------------------------------------------------------------
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true });
UserSchema.index({ 'addresses.location': '2dsphere' });
