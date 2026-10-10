import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true, unique: true })
  booking: Types.ObjectId; // unique: one review per booking

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ type: String, default: null }) // optional text
  review: string | null;

  @Prop({ type: Types.ObjectId, ref: 'Provider', required: true })
  provider: Types.ObjectId; // copied from booking for aggregation

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  service: Types.ObjectId; // copied from booking for aggregation
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// -- Indexes ----------------------------------------------------------------
ReviewSchema.index({ service: 1, createdAt: -1 });
ReviewSchema.index({ provider: 1, createdAt: -1 });
