import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class HowItWorksStepDto {
  @IsString()
  title: string;

  @IsString()
  desc: string;
}

export class FaqItemDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;
}

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsMongoId()
  category: string;

  @IsString()
  description: string;

  /** Price in paise (₹499 = 49900). */
  @IsNumber()
  price: number;

  /** Duration in minutes. */
  @IsNumber()
  duration: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whatIsCovered?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whatIsNotCovered?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HowItWorksStepDto)
  howItWorks?: HowItWorksStepDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  faq?: FaqItemDto[];
}
