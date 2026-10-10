import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

/** GeoJSON Point: { type: "Point", coordinates: [lng, lat] } */
export class GeoLocationDto {
  @IsOptional()
  @IsString()
  type: string = 'Point';

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates: [number, number]; // [longitude, latitude]
}

/** Immutable address snapshot embedded on Order at checkout. */
export class AddressSnapshotDto {
  @IsString()
  line: string;

  @IsString()
  city: string;

  @ValidateNested()
  @Type(() => GeoLocationDto)
  location: GeoLocationDto;
}

/** Named address entry saved in User.addresses[]. */
export class UserAddressDto {
  @IsString()
  id: string;

  @IsString()
  label: string;

  @IsString()
  line: string;

  @IsString()
  city: string;

  @ValidateNested()
  @Type(() => GeoLocationDto)
  location: GeoLocationDto;
}
