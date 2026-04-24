import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProviderSkillDto {
  @ApiProperty({ example: 'provider-uuid' })
  @IsString()
  @IsNotEmpty()
  service_provider_id: string;

  @ApiProperty({ example: 'skill-uuid' })
  @IsString()
  @IsNotEmpty()
  skill_id: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;
}
