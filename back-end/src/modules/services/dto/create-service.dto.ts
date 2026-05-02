import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Standard Home Clean' })
  @IsString()
  @IsNotEmpty()
  service_name: string;

  @ApiProperty({ example: 'Complete standard clean for up to 3BHK homes.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://placehold.co/400x200/4A90D9/white?text=Standard+Clean', required: false })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiProperty({ example: 499 })
  @IsNumber()
  @Min(0)
  base_price: number;

  @ApiProperty({ example: 120 })
  @IsNumber()
  @Min(1)
  estimated_duration_min: number;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsString()
  @IsNotEmpty()
  category_id: string;
}
