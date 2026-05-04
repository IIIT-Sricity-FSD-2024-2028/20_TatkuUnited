import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({ example: 'Cleaning & Pest Control' })
  @IsString()
  @IsNotEmpty()
  unit_name: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({ example: 'uuid-of-collective' })
  @IsUUID()
  @IsNotEmpty()
  collective_id: string;

  @ApiProperty({ example: 'Appliances', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'Zone A', required: false })
  @IsString()
  @IsOptional()
  zone?: string;
}
