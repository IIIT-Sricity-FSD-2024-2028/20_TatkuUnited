import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({ description: 'Region name', example: 'Chennai North' })
  @IsString()
  @IsNotEmpty()
  region_name: string;

  @ApiPropertyOptional({ description: 'Is active flag', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
