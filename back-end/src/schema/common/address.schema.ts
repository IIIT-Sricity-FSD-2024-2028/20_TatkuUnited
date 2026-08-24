import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { GeoPoint, GeoPointSchema } from './geo-point.schema';

@Schema({ _id: false })
export class Address {
  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  line!: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ type: GeoPointSchema })
  location!: GeoPoint;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
