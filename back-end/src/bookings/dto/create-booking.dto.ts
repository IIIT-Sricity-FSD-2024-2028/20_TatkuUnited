import {
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsMongoId()
  service: string;

  @IsOptional()
  @IsMongoId()
  provider?: string;

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
  @Min(0)
  @Max(1439)
  startTime: number;

  /** startTime + service.duration. */
  @IsNumber()
  @Min(1)
  @Max(1440)
  endTime: number;

  /** startTime − travelBufferMinutes — provider is blocked from here to endTime. */
  @IsNumber()
  @Min(-120)
  @Max(1439)
  blockStartTime: number;

  /** Snapshot of Service.price in paise. */
  @IsNumber()
  @Min(0)
  price: number;

  /** Snapshot of PlatformSetting.platformFeePercent. */
  @IsNumber()
  @Min(0)
  @Max(100)
  platformFeePercent: number;

  /** round(price × platformFeePercent / 100). */
  @IsNumber()
  @Min(0)
  platformShare: number;

  /** price − platformShare. */
  @IsNumber()
  @Min(0)
  providerShare: number;
}
