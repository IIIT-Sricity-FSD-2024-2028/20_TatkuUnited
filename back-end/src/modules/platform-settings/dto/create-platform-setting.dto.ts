import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlatformSettingDto {
  @ApiProperty({
    example: 'max_booking_window_days',
    description: 'Unique configuration key',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  key: string;

  @ApiProperty({
    example: '30',
    description: 'Configuration value (always stored as string)',
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({
    example: 'Max days ahead a customer can schedule',
    description: 'Human-readable description of the setting',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'uuid-v4-super-user-id',
    description: 'super_user_id of the caller (from x-id header)',
  })
  @IsUUID()
  updated_by: string;
}
