import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCollectiveDto {
  @ApiProperty({ example: 'South Chennai Collective' })
  @IsString()
  @IsNotEmpty()
  collective_name: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({ example: ['sector-uuid-1', 'sector-uuid-2'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sector_ids?: string[];
}
