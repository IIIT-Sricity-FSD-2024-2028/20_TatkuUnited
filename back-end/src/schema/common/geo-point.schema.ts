import { Schema } from 'mongoose';

/**
 * Shared GeoJSON Point sub-schema.
 * Usage: @Prop({ type: GeoPointSchema, required: true })
 * Store as { type: "Point", coordinates: [longitude, latitude] }
 * Longitude comes FIRST — this is the GeoJSON / MongoDB standard.
 */
export const GeoPointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  { _id: false },
);

export type GeoPoint = { type: string; coordinates: [number, number] };
