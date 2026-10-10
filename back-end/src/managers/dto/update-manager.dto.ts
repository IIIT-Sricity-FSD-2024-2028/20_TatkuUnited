import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { GeoLocationDto } from '../../common/dto/geo-location.dto';

export class UpdateManagerDto {
  @IsOptional()
  @IsNumber()
  salary?: number;

  @IsOptional()
  @IsNumber()
  experience?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoLocationDto)
  location?: GeoLocationDto;

  @IsOptional()
  @IsEnum(['active', 'suspended', 'inactive'])
  status?: string;

  @IsOptional()
  @IsString()
  razorpayAccountId?: string;
}
