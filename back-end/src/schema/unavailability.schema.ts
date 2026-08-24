import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Provider } from './provider.schema';

export type UnavailabilityDocument = HydratedDocument<Unavailability>;

@Schema()
export class Unavailability {
  @Prop({
    type: Types.ObjectId,
    ref: Provider.name,
    required: true,
    index: true,
  })
  provider!: Types.ObjectId;

  @Prop({ required: true })
  startDateTime!: Date;

  @Prop({ required: true })
  endDateTime!: Date;

  @Prop({ type: Boolean, default: false })
  recurring!: boolean;

  @Prop()
  reason?: string;
}

export const UnavailabilitySchema =
  SchemaFactory.createForClass(Unavailability);
