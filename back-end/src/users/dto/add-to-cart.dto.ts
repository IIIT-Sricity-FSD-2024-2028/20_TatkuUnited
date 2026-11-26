import {
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AddToCartDto {
  @IsMongoId()
  service: string;

  @IsDateString()
  scheduledDate: string;

  @IsNumber()
  @Min(0)
  @Max(1439)
  startTime: number;

  @IsNumber()
  @Min(1)
  @Max(1440)
  endTime: number;

  @IsOptional()
  @IsString()
  addressId?: string;
}
