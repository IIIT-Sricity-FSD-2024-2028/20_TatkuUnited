/** Serialized counterpart of back-end/src/schema/platform-setting.schema.ts. */
import type { BaseDocument } from './index';

export interface MatchWeights {
  distance: number;
  rating: number;
  availability: number;
}

export interface PlatformSetting extends BaseDocument {
  platformFeePercent: number;
  maxAssignmentDistanceKm: number;
  slotIntervalMinutes: number;
  firstSlotStart: number;
  lastSlotStart: number;
  bookingWindowDays: number;
  minLeadMinutes: number;
  travelBufferMinutes: number;
  offerTimeoutMinutes: number;
  maxOfferRounds: number;
  offerBatchSize: number;
  payoutHoldHours: number;
  matchWeights: MatchWeights;
}

export type PlatformSettingDocument = PlatformSetting;
