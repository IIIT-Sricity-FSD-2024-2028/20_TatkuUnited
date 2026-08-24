import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.schema';
import { Service } from './service.schema';
import { GeoPoint, GeoPointSchema } from './common/geo-point.schema';
import { ProviderStatus } from './common/enums';

export type ProviderDocument = HydratedDocument<Provider>;

@Schema()
export class Provider {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true,
    index: true,
  })
  user!: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: Service.name, default: [] })
  offeredServices!: Types.ObjectId[];

  // years of experience
  @Prop({ type: Number, default: 0, min: 0 })
  experience!: number;

  // 0-23 hour markers for working window
  @Prop({ type: Number, required: true, min: 0, max: 23 })
  workHourStart!: number;

  @Prop({ type: Number, required: true, min: 0, max: 23 })
  workHourEnd!: number;

  @Prop({ type: GeoPointSchema })
  location!: GeoPoint;

  @Prop({ type: Number, default: 0, min: 0 })
  activeJobCount!: number;

  @Prop({ type: String, enum: ProviderStatus, default: ProviderStatus.OFFLINE })
  status!: ProviderStatus;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);

// Enables geospatial "find providers near me" queries
ProviderSchema.index({ location: '2dsphere' });
