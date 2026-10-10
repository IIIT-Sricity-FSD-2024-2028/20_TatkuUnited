import { IsDateString, IsMongoId, IsNumber } from 'class-validator';

export class CreateBookingDto {
  @IsMongoId()
  service: string;

  @IsMongoId()
  provider: string;

  @IsMongoId()
  customer: string;

  @IsMongoId()
  order: string;

  @IsMongoId()
  region: string;

  /** Midnight of the IST calendar day. */
  @IsDateString()
  scheduledDate: string;

  /** Minutes from midnight, on the slot grid (e.g. 570 = 9:30). */
  @IsNumber()
  startTime: number;

  /** startTime + service.duration. */
  @IsNumber()
  endTime: number;

  /** startTime − travelBufferMinutes — provider is blocked from here to endTime. */
  @IsNumber()
  blockStartTime: number;

  /** Snapshot of Service.price in paise. */
  @IsNumber()
  price: number;

  /** Snapshot of PlatformSetting.platformFeePercent. */
  @IsNumber()
  platformFeePercent: number;

  /** round(price × platformFeePercent / 100). */
  @IsNumber()
  platformShare: number;

  /** price − platformShare. */
  @IsNumber()
  providerShare: number;
}
