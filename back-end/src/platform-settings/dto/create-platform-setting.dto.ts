import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MatchWeightsDto {
  @IsOptional()
  @IsNumber()
  distance?: number;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsNumber()
  availability?: number;
}

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

  /** How long a provider has to accept or reject an offer, in minutes. Default 5. */
  @IsOptional()
  @IsNumber()
  offerTimeoutMinutes?: number;

  /** Maximum rounds of offers before cancelling. Default 3. */
  @IsOptional()
  @IsNumber()
  maxOfferRounds?: number;

  /** Batch size of providers offered per round. Default 5. */
  @IsOptional()
  @IsNumber()
  offerBatchSize?: number;

  /** Hours to hold payout after job completion. Default 0. */
  @IsOptional()
  @IsNumber()
  payoutHoldHours?: number;

  /** Matching score weights. */
  @IsOptional()
  @ValidateNested()
  @Type(() => MatchWeightsDto)
  matchWeights?: MatchWeightsDto;
}

