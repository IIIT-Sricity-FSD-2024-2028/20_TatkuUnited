import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';

export class UpdateCartMetaDto {
  @ApiProperty({
    description: 'Service address',
    required: false,
    example: '42, MG Road, Chennai',
  })
  @IsOptional()
  @IsString()
  service_address?: string;
}
