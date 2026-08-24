import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Stored as GeoJSON so you can use Mongo's $near / 2dsphere queries.
@Schema({ _id: false })
export class GeoPoint {
  @Prop({ type: String, enum: ['Point'], default: 'oint' })
  type!: string;

  // [longitude, latitude]
  @Prop({ type: [Number], required: true })
  coordinates!: number[];
}

export const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);
