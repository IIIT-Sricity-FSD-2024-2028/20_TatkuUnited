import { IsDateString, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUnavailabilityDto {
  @IsMongoId()
  provider: string;

  /** Midnight of the IST calendar day. */
  @IsDateString()
  date: string;

  /** Minutes from midnight, on the slot grid (e.g. 480 = 08:00). startTime < endTime. */
  @IsNumber()
  startTime: number;

  /** Minutes from midnight, on the slot grid (e.g. 600 = 10:00). */
  @IsNumber()
  endTime: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
