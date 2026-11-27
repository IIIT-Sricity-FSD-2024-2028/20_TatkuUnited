import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidGeoCoordinates } from '../utils/geo.util';

@ValidatorConstraint({ name: 'validGeoCoordinates', async: false })
export class ValidGeoCoordinatesConstraint
  implements ValidatorConstraintInterface
{
  validate(coords: unknown) {
    return isValidGeoCoordinates(coords);
  }

  defaultMessage() {
    return 'Coordinates must be [longitude, latitude] with lng in [-180, 180], lat in [-90, 90], and not [0, 0]';
  }
}

/** GeoJSON Point: { type: "Point", coordinates: [lng, lat] } */
export class GeoLocationDto {
  @IsOptional()
  @IsString()
  type: string = 'Point';

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  @Validate(ValidGeoCoordinatesConstraint)
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
