import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({ example: 'Plumbing' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Expertise in fixing leaks and pipes.', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
