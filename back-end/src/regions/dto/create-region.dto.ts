import { Type } from 'class-transformer';
import { IsBoolean, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';
import { GeoLocationDto } from '../../common/dto/geo-location.dto';

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
  @IsBoolean()
  isActive?: boolean;
}
