import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class HowItWorksStep {
  @ApiProperty({ description: 'Step title', example: 'Book a slot' })
  @IsString()
  @IsNotEmpty()
  step_title: string;

  @ApiProperty({ description: 'Step description', example: 'Choose a convenient time' })
  @IsString()
  @IsNotEmpty()
  step_description: string;
}

export class UpsertServiceContentDto {
  @ApiProperty({
    description: 'How the service works (step-by-step)',
    type: [HowItWorksStep],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HowItWorksStep)
  how_it_works?: { step_title: string; step_description: string }[];

  @ApiProperty({
    description: 'What is covered by the service',
    type: [String],
    required: false,
    example: ['Living room', 'Kitchen', 'Bathrooms'],
  })
  @IsOptional()
  @IsArray()
  what_is_covered?: string[];

  @ApiProperty({
    description: 'What is NOT covered by the service',
    type: [String],
    required: false,
    example: ['Outdoor areas', 'Balcony'],
  })
  @IsOptional()
  @IsArray()
  what_is_not_covered?: string[];
}
