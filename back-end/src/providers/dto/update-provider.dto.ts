import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { GeoLocationDto } from '../../common/dto/geo-location.dto';

export class UpdateProviderDto {
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  offeredServices?: string[];

  @IsOptional()
  @IsNumber()
  experience?: number;

  @IsOptional()
  @IsNumber()
  workHourStart?: number;

  @IsOptional()
  @IsNumber()
  workHourEnd?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  workingDays?: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoLocationDto)
  location?: GeoLocationDto;

  @IsOptional()
  @IsEnum(['pending', 'approved', 'suspended'])
  status?: string;

  @IsOptional()
  @IsString()
  razorpayAccountId?: string;

  @IsOptional()
  @IsMongoId()
  region?: string;
}
