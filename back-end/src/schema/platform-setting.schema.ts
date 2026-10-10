import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Single-document collection � the admin creates exactly one record.
 * Read on every checkout and slot listing. Changes only affect future bookings.
 */
export type PlatformSettingDocument = PlatformSetting & Document;

@Schema({ timestamps: true })
export class PlatformSetting {
  /** Platform commission in percent (e.g. 20 for 20%). Provider share = 100 - this. */
  @Prop({ type: Number, required: true })
  platformFeePercent: number;

  /** Maximum distance (km) between job address and provider for auto-assignment. */
  @Prop({ type: Number, required: true })
  maxAssignmentDistanceKm: number;

  /** Slot step in minutes. Default 30. */
  @Prop({ type: Number, required: true, default: 30 })
  slotIntervalMinutes: number;

  /** First allowed slot start, minutes from midnight. Default 480 (08:00). */
  @Prop({ type: Number, required: true, default: 480 })
  firstSlotStart: number;

  /** Last allowed slot start, minutes from midnight. Default 1170 (19:30). */
  @Prop({ type: Number, required: true, default: 1170 })
  lastSlotStart: number;

  /** How many days ahead a customer can book (today counts as 1). Default 3. */
  @Prop({ type: Number, required: true, default: 3 })
  bookingWindowDays: number;

  /** Minimum lead time in minutes for today's slots. Default 120. */
  @Prop({ type: Number, required: true, default: 120 })
  minLeadMinutes: number;

  /** Travel buffer in minutes blocked before each job. Default 30. */
  @Prop({ type: Number, required: true, default: 30 })
  travelBufferMinutes: number;

  /** How long a provider has to accept or reject an offer, in minutes. Default 10. */
  @Prop({ type: Number, required: true, default: 10 })
  offerTimeoutMinutes: number;
}

export const PlatformSettingSchema =
  SchemaFactory.createForClass(PlatformSetting);
