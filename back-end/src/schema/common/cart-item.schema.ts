import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Service } from '../service.schema';

@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: Service.name, required: true })
  service!: Types.ObjectId;

  @Prop({ required: true })
  scheduledDate!: Date;

  // Stored as "HH:mm" strings; validate format at the DTO layer
  @Prop({ required: true })
  startTime!: string;

  @Prop({ required: true })
  endTime!: string;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
