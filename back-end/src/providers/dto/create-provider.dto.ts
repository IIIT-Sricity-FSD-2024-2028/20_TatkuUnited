import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
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
  experience: number;

  /** Minutes from midnight (e.g. 480 = 08:00). */
  @IsNumber()
  workHourStart: number;

  /** Minutes from midnight (e.g. 1200 = 20:00). */
  @IsNumber()
  workHourEnd: number;

  /** 0 = Sunday … 6 = Saturday. */
  @IsArray()
  @IsNumber({}, { each: true })
  workingDays: number[];

  @ValidateNested()
  @Type(() => GeoLocationDto)
  location: GeoLocationDto;

  @IsOptional()
  @IsEnum(ProviderStatus)
  status?: ProviderStatus;
}

