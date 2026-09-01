import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateJobAssignmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  booking_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  service_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sp_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  scheduled_date: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  hour_start: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  hour_end: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
