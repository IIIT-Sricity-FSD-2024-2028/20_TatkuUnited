import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GeoPointSchema } from './common';
import { ManagerStatus } from '../common/enums';

type GeoPointType = { type: string; coordinates: [number, number] };

export type ManagerDocument = Manager & Document;

@Schema({ timestamps: true })
export class Manager {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 0 }) // paise
  salary: number;

  @Prop({ type: String, default: null })
  razorpayAccountId: string | null;

  @Prop({ type: Number, required: true, default: 0 }) // years
  experience: number;

  @Prop({ type: GeoPointSchema, required: true })
  location: GeoPointType;

  @Prop({
    type: String,
    enum: Object.values(ManagerStatus),
    default: ManagerStatus.ACTIVE,
  })
  status: ManagerStatus;
}

export const ManagerSchema = SchemaFactory.createForClass(Manager);

// -- Indexes -------------------------------------------------------------------
ManagerSchema.index({ user: 1 }, { unique: true });
ManagerSchema.index({ location: '2dsphere' });
