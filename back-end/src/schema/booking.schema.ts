import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BookingStatus, CancelledBy, PayoutStatus } from '../common/enums';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  service: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Provider', required: true })
  provider: Types.ObjectId; // tentative until accepted

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Region', required: true })
  region: Types.ObjectId;

  // -- Slot ------------------------------------------------------------------
  @Prop({ type: Date, required: true }) // midnight of IST calendar day
  scheduledDate: Date;

  @Prop({ type: Number, required: true }) // minutes from midnight, on slot grid
  startTime: number;

  @Prop({ type: Number, required: true }) // startTime + service.duration
  endTime: number;

  @Prop({ type: Number, required: true }) // startTime - travelBufferMinutes (snapshot)
  blockStartTime: number;

  // -- Status ----------------------------------------------------------------
  @Prop({
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Prop({
    type: String,
    enum: Object.values(CancelledBy),
    default: null,
  })
  cancelledBy: CancelledBy | null;

  @Prop({ type: String, default: null })
  cancelledReason: string | null;

  // -- Provider offer --------------------------------------------------------
  @Prop({ type: Date, default: null }) // set while awaiting_provider
  offerExpiresAt: Date | null;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Provider' }], default: [] })
  declinedBy: Types.ObjectId[]; // providers who rejected / timed out / cancelled

  // -- Financials (snapshots) ------------------------------------------------
  @Prop({ type: Number, required: true }) // paise - snapshot of Service.price
  price: number;

  @Prop({ type: Number, required: true }) // snapshot of PlatformSetting.platformFeePercent
  platformFeePercent: number;

  @Prop({ type: Number, required: true }) // round(price * fee / 100)
  platformShare: number;

  @Prop({ type: Number, required: true }) // price - platformShare
  providerShare: number;

  // -- Payout ----------------------------------------------------------------
  @Prop({
    type: String,
    enum: Object.values(PayoutStatus),
    default: PayoutStatus.PENDING,
  })
  payoutStatus: PayoutStatus;

  @Prop({ type: Date, default: null })
  payoutAt: Date | null;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// -- Indexes ----------------------------------------------------------------
// Partial unique index: blocks identical start-time double-bookings for active statuses
BookingSchema.index(
  { provider: 1, scheduledDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: ['pending', 'awaiting_provider', 'confirmed', 'in_progress'],
      },
    },
  },
);
BookingSchema.index({ provider: 1, scheduledDate: 1, status: 1 });
BookingSchema.index({ status: 1, offerExpiresAt: 1 }); // offer-expiry sweep
BookingSchema.index({ customer: 1, createdAt: -1 });
BookingSchema.index({ region: 1, scheduledDate: 1, status: 1 });
BookingSchema.index({ order: 1 });
BookingSchema.index({ payoutStatus: 1, status: 1 });
