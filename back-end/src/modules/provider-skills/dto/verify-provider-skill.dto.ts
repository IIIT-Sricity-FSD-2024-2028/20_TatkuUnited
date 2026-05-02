import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class VerifyProviderSkillDto {
  @ApiProperty({ example: 'skill-uuid' })
  @IsUUID()
  @IsNotEmpty()
  skill_id: string;
}
