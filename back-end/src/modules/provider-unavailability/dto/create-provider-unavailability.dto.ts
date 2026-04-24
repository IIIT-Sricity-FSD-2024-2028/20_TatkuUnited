import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProviderUnavailabilityDto {
  @ApiProperty({ example: 'provider-uuid' })
  @IsString()
  @IsNotEmpty()
  provider_id: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  start_time: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  @IsNotEmpty()
  end_time: string;

  @ApiProperty({ example: 'Medical leave', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
