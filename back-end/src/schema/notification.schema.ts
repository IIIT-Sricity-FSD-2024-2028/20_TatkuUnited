import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, required: true })
  type: string; // e.g. 'job_offer', 'job_taken', 'job_started', 'job_completed', 'provider_assigned', 'payment_success', 'cancellation'

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Booking', default: null })
  booking: Types.ObjectId | null;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Date, default: null })
  readAt: Date | null;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Index for rapid user inbox and polling: { user, readAt, createdAt }
NotificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });
