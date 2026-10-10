import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GeoPointSchema } from './common';
import { ProviderStatus } from '../common/enums';

type GeoPointType = { type: string; coordinates: [number, number] };

export type ProviderDocument = Provider & Document;

@Schema({ timestamps: true })
export class Provider {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Service' }], default: [] })
  offeredServices: Types.ObjectId[];

  @Prop({ type: Number, required: true, default: 0 }) // years
  experience: number;

  @Prop({ type: Number, required: true }) // minutes from midnight, e.g. 480 = 8:00
  workHourStart: number;

  @Prop({ type: Number, required: true }) // minutes from midnight, e.g. 1200 = 20:00
  workHourEnd: number;

  @Prop({ type: [Number], default: [] }) // 0=Sun ... 6=Sat
  workingDays: number[];

  @Prop({ type: GeoPointSchema, required: true })
  location: GeoPointType;

  @Prop({
    type: String,
    enum: Object.values(ProviderStatus),
    default: ProviderStatus.PENDING,
  })
  status: ProviderStatus;

  @Prop({ type: Number, default: 0 })
  rating: number;

  @Prop({ type: Number, default: 0 })
  ratingCount: number;

  @Prop({ type: Types.ObjectId, ref: 'Region', default: null })
  region: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  razorpayAccountId: string | null;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);

// -- Indexes -------------------------------------------------------------------
ProviderSchema.index({ location: '2dsphere' });
ProviderSchema.index({ status: 1, offeredServices: 1 });
ProviderSchema.index({ region: 1, status: 1 });
