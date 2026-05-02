import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceFaqDto {
  @ApiProperty({ description: 'FAQ question', example: 'How long does the service take?' })
  @IsNotEmpty()
  @IsString()
  question: string;

  @ApiProperty({ description: 'FAQ answer', example: 'Typically 1-2 hours depending on the scope.' })
  @IsNotEmpty()
  @IsString()
  answer: string;

  @ApiProperty({ description: 'Display order (auto-assigned if omitted)', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  display_order?: number;
}
