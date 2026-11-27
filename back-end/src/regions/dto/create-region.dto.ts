import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { GeoLocationDto } from '../../common/dto/geo-location.dto';

export class GeoPolygonDto {
  @IsString()
  @IsIn(['Polygon'])
  type: 'Polygon';

  @IsArray()
  coordinates: number[][][];
}

export class CreateRegionDto {
  @IsString()
  name: string;

  @IsMongoId()
  manager: string;

  /** Centroid point. Recomputed automatically as providers join/leave. */
  @ValidateNested()
  @Type(() => GeoLocationDto)
  location: GeoLocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPolygonDto)
  boundary?: GeoPolygonDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  radiusKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRadiusKm?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
