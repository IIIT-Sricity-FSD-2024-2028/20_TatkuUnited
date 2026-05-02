import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CompleteJobDto {
  @ApiProperty({
    description: 'Optional completion notes',
    required: false,
    example: 'Work completed satisfactorily',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
