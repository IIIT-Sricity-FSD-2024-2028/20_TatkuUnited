import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class LinkServiceSkillDto {
  @ApiProperty({ description: 'ID of the skill to link', example: 'uuid-here' })
  @IsNotEmpty()
  @IsUUID()
  skill_id: string;
}
