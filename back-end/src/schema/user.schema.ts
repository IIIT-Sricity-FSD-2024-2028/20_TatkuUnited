import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Address, AddressSchema } from './common/address.schema';
import {
  SavedPaymentMethod,
  SavedPaymentMethodSchema,
} from './common/saved-payment-method.schema';
import { UserRole, UserStatus } from './common/enums';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  // Never select this field back by default; hash it in a pre-save hook.
  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ type: [AddressSchema], default: [] })
  addresses!: Address[];

  @Prop()
  phone?: string;

  @Prop()
  dob?: Date;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  rating!: number;

  @Prop({ type: String, enum: UserRole, default: UserRole.CUSTOMER })
  role!: UserRole;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Prop({ type: [SavedPaymentMethodSchema], default: [] })
  savedPaymentMethods!: SavedPaymentMethod[];

  // createdAt is added automatically via the `timestamps` option above
  createdAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
