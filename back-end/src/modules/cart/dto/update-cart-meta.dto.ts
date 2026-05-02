import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';

export class UpdateCartMetaDto {
  @ApiProperty({
    description: 'Booking type',
    enum: ['INSTANT', 'SCHEDULED'],
    required: false,
    example: 'SCHEDULED',
  })
  @IsOptional()
  @IsEnum(['INSTANT', 'SCHEDULED'])
  booking_type?: 'INSTANT' | 'SCHEDULED';

  @ApiProperty({
    description: 'Scheduled date/time (ISO 8601)',
    required: false,
    example: '2026-06-15T10:00:00Z',
  })
  @IsOptional()
  @IsISO8601()
  scheduled_at?: string;

  @ApiProperty({
    description: 'Service address',
    required: false,
    example: '42, MG Road, Chennai',
  })
  @IsOptional()
  @IsString()
  service_address?: string;
}
