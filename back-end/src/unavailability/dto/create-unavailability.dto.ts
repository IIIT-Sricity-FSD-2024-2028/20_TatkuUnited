import {
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateUnavailabilityDto {
  @IsMongoId()
  provider: string;

  /** Midnight of the IST calendar day. */
  @IsDateString()
  date: string;

  /** Minutes from midnight, on the slot grid (e.g. 480 = 08:00). startTime < endTime. */
  @IsNumber()
  @Min(0)
  @Max(1439)
  startTime: number;

  /** Minutes from midnight, on the slot grid (e.g. 600 = 10:00). */
  @IsNumber()
  @Min(1)
  @Max(1440)
  endTime: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
