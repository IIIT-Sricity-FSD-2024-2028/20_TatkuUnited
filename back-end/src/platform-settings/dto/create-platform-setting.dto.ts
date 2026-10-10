import { IsNumber } from 'class-validator';

export class CreatePlatformSettingDto {
  /** Platform commission in percent (e.g. 20 for 20%). Provider share = 100 − this. */
  @IsNumber()
  platformFeePercent: number;

  /** Maximum distance in km between job address and provider for auto-assignment. */
  @IsNumber()
  maxAssignmentDistanceKm: number;

  /** Slot step in minutes. Typically 30. */
  @IsNumber()
  slotIntervalMinutes: number;

  /** First allowed slot start, minutes from midnight. Typically 480 (08:00). */
  @IsNumber()
  firstSlotStart: number;

  /** Last allowed slot start, minutes from midnight. Typically 1170 (19:30). */
  @IsNumber()
  lastSlotStart: number;

  /** How many calendar days ahead a customer can book (today = 1). Typically 3. */
  @IsNumber()
  bookingWindowDays: number;

  /** Minimum lead time in minutes for today's slots. Typically 120. */
  @IsNumber()
  minLeadMinutes: number;

  /** Travel buffer in minutes blocked before each job. Typically 30. */
  @IsNumber()
  travelBufferMinutes: number;

  /** How long a provider has to accept or reject an offer, in minutes. Typically 10. */
  @IsNumber()
  offerTimeoutMinutes: number;
}
