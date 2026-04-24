import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateSectorDto {
  @ApiProperty({ example: 'Adyar East' })
  @IsString()
  @IsNotEmpty()
  sector_name: string;

  @ApiProperty({ example: 'Tamil Nadu' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: 'South' })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty({ example: 'HIGH', enum: ['HIGH', 'MEDIUM', 'LOW'] })
  @IsString()
  @IsNotEmpty()
  density_tier: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({ example: 'uuid-of-collective' })
  @IsString()
  @IsNotEmpty()
  collective_id: string;
}
