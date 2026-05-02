import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateProviderSkillDto {
  @ApiProperty({ example: 'provider-uuid' })
  @IsUUID()
  @IsNotEmpty()
  service_provider_id: string;

  @ApiProperty({ example: 'skill-uuid' })
  @IsUUID()
  @IsNotEmpty()
  skill_id: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;
}
