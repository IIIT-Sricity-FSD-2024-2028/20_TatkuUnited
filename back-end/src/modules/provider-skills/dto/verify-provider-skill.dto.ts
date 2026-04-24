import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyProviderSkillDto {
  @ApiProperty({ example: 'skill-uuid' })
  @IsString()
  @IsNotEmpty()
  skill_id: string;
}
