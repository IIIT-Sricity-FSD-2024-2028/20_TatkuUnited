import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Booking } from './booking.schema';
import { User } from './user.schema';
import { Service } from './service.schema';

export type ReviewDocument = HydratedDocument<Review>;

@Schema()
export class Review {
  @Prop({
    type: Types.ObjectId,
    ref: Booking.name,
    required: true,
    unique: true,
    index: true,
  })
  booking!: Types.ObjectId;

  @Prop({ required: true, min: 0, max: 5 })
  rating!: number;

  @Prop()
  review?: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  user!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Service.name,
    required: true,
    index: true,
  })
  service!: Types.ObjectId;

  @Prop({ default: Date.now })
  date!: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
