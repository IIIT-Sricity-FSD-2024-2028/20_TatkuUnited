import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({ example: 'Cleaning & Pest Control' })
  @IsString()
  @IsNotEmpty()
  unit_name: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({ example: 'uuid-of-collective' })
  @IsString()
  @IsNotEmpty()
  collective_id: string;
}
