import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GeoPointSchema } from './common';

type GeoPointType = { type: string; coordinates: [number, number] };

export type RegionDocument = Region & Document;

@Schema({ timestamps: true })
export class Region {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Manager', required: true })
  manager: Types.ObjectId;

  @Prop({ type: GeoPointSchema, required: true }) // centroid; recomputed as providers join/leave
  location: GeoPointType;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const RegionSchema = SchemaFactory.createForClass(Region);

// -- Indexes -------------------------------------------------------------------
RegionSchema.index({ location: '2dsphere' });
RegionSchema.index({ manager: 1 });
