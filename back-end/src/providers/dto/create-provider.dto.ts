import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { GeoLocationDto } from '../../common/dto/geo-location.dto';
import { ProviderStatus } from '../../common/enums/provider-status.enum';

export class CreateProviderDto {
  @IsMongoId()
  user: string;

  @IsArray()
  @IsMongoId({ each: true })
  offeredServices: string[];

  @IsNumber()
  @Min(0)
  @Max(80)
  experience: number;

  /** Minutes from midnight (e.g. 480 = 08:00). */
  @IsNumber()
  @Min(0)
  @Max(1439)
  workHourStart: number;

  /** Minutes from midnight (e.g. 1200 = 20:00). */
  @IsNumber()
  @Min(1)
  @Max(1440)
  workHourEnd: number;

  /** 0 = Sunday … 6 = Saturday. */
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  workingDays: number[];

  @ValidateNested()
  @Type(() => GeoLocationDto)
  location: GeoLocationDto;

  @IsOptional()
  @IsEnum(ProviderStatus)
  status?: ProviderStatus;
}
