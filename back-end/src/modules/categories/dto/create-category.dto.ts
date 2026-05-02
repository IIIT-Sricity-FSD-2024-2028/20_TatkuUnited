import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Home Cleaning' })
  @IsString()
  @IsNotEmpty()
  category_name: string;

  @ApiProperty({ example: 'All home cleaning services', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '🧹', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ example: 'https://placehold.co/400x200/4A90D9/white?text=Home+Cleaning', required: false })
  @IsString()
  @IsOptional()
  image_url?: string;
}
