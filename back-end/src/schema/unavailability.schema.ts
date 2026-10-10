import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UnavailabilityDocument = Unavailability & Document;

@Schema({ timestamps: true })
export class Unavailability {
  @Prop({ type: Types.ObjectId, ref: 'Provider', required: true })
  provider: Types.ObjectId;

  @Prop({ type: Date, required: true }) // midnight of the IST calendar day
  date: Date;

  @Prop({ type: Number, required: true }) // minutes from midnight, on slot grid
  startTime: number;

  @Prop({ type: Number, required: true }) // minutes from midnight, on slot grid; startTime < endTime
  endTime: number;

  @Prop({ type: String, default: null })
  reason: string | null;
}

export const UnavailabilitySchema =
  SchemaFactory.createForClass(Unavailability);

// -- Indexes ----------------------------------------------------------------
UnavailabilitySchema.index({ provider: 1, date: 1 });
