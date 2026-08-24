import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Service } from './service.schema';
import { Provider } from './provider.schema';
import { User } from './user.schema';
import { BookingStatus, CancelledBy } from './common/enums';

export type BookingDocument = HydratedDocument<Booking>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Booking {
  @Prop({
    type: Types.ObjectId,
    ref: Service.name,
    required: true,
    index: true,
  })
  service!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Provider.name,
    required: true,
    index: true,
  })
  provider!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  customer!: Types.ObjectId;

  @Prop({ required: true })
  date!: Date;

  @Prop({ required: true })
  startTime!: string;

  @Prop({ required: true })
  endTime!: string;

  @Prop({ type: String, enum: BookingStatus, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Prop({ type: String, enum: CancelledBy })
  cancelledBy?: CancelledBy;

  @Prop()
  cancelledReason?: string;

  // createdAt is added automatically via the `timestamps` option above
  createdAt?: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
