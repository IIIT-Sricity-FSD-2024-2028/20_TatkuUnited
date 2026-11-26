import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { GeoLocationDto } from '../../common/dto/geo-location.dto';

export class AddAddressDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  line: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @ValidateNested()
  @Type(() => GeoLocationDto)
  location: GeoLocationDto;
}
