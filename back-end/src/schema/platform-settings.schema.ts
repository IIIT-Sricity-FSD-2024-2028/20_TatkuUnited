import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.schema';

export type PlatformSettingsDocument = HydratedDocument<PlatformSettings>;

// This collection is typically a singleton (one document holding global config).
@Schema()
export class PlatformSettings {
  @Prop({ required: true, default: 30 })
  maxBookingWindowDays!: number;

  @Prop({ required: true, default: 24 })
  cancellationCutoffHours!: number;

  @Prop({ required: true, default: 10 })
  platformFeePercent!: number;

  @Prop({ required: true, default: 5 })
  providerFeePercent!: number;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  updatedBy!: Types.ObjectId;
}

export const PlatformSettingsSchema =
  SchemaFactory.createForClass(PlatformSettings);
