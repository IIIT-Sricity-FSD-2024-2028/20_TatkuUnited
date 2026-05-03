import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { DATE_ONLY_REGEX, TIME_24H_REGEX } from '../../../common/validation/patterns';

export class CreateProviderUnavailabilityDto {
  @ApiProperty({ example: 'provider-uuid' })
  @IsUUID()
  @IsNotEmpty()
  provider_id: string;

  @ApiProperty({ example: '2026-04-05' })
  @IsString()
  @IsNotEmpty()
  @Matches(DATE_ONLY_REGEX, { message: 'date must be in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(TIME_24H_REGEX, { message: 'start_time must be in HH:mm 24-hour format' })
  start_time: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(TIME_24H_REGEX, { message: 'end_time must be in HH:mm 24-hour format' })
  end_time: string;

  @ApiProperty({ example: 'Medical leave', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
