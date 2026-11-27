import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { GeoPointSchema } from './common';

type GeoPointType = { type: string; coordinates: [number, number] };
type GeoPolygonType = { type: 'Polygon'; coordinates: number[][][] };

const GeoPolygonSchema = new MongooseSchema(
  {
    type: { type: String, enum: ['Polygon'] },
    coordinates: { type: [[[Number]]] },
  },
  { _id: false },
);

export type RegionDocument = Region & Document;

@Schema({ timestamps: true })
export class Region {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Manager', required: true })
  manager: Types.ObjectId;

  @Prop({ type: GeoPointSchema, required: true }) // centroid; recomputed as providers join/leave
  location: GeoPointType;

  @Prop({ type: GeoPolygonSchema, required: false })
  boundary?: GeoPolygonType;

  @Prop({ type: Number, default: 25 }) // fallback service radius around centroid when no polygon boundary is set
  radiusKm?: number;

  @Prop({ type: Number, default: null }) // optional per-region distance cap for matching
  maxRadiusKm?: number | null;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const RegionSchema = SchemaFactory.createForClass(Region);

// -- Indexes -------------------------------------------------------------------
RegionSchema.index({ location: '2dsphere' });
RegionSchema.index({ boundary: '2dsphere' }, { sparse: true });
RegionSchema.index({ manager: 1 });
