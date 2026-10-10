import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUnavailabilityDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsNumber()
  startTime?: number;

  @IsOptional()
  @IsNumber()
  endTime?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
