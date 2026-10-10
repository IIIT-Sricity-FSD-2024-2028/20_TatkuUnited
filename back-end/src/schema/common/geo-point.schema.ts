/**
 * Shared GeoJSON Point sub-schema.
 * Usage: @Prop({ type: GeoPointSchema, required: true })
 * Store as { type: "Point", coordinates: [longitude, latitude] }
 * Longitude comes FIRST — this is the GeoJSON / MongoDB standard.
 */
export const GeoPointSchema = {
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true }, // [longitude, latitude]
};

export type GeoPoint = { type: string; coordinates: [number, number] };
