import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min, IsEnum, IsString } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ description: 'ID of the service to add', example: 'uuid-here' })
  @IsNotEmpty()
  @IsUUID()
  service_id: string;

  @ApiProperty({ description: 'Quantity (defaults to 1)', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiProperty({ description: 'Booking type', example: 'INSTANT' })
  @IsOptional()
  @IsEnum(['INSTANT', 'SCHEDULED'])
  booking_type?: 'INSTANT' | 'SCHEDULED';

  @ApiProperty({ description: 'Scheduled date and time', required: false })
  @IsOptional()
  @IsString()
  scheduled_at?: string;
}
