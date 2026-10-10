import { Type } from 'class-transformer';
import { IsMongoId, IsNumber, ValidateNested } from 'class-validator';
import { GeoLocationDto } from '../../common/dto/geo-location.dto';

export class CreateManagerDto {
  @IsMongoId()
  user: string;

  /** Salary in paise (₹499 = 49900). */
  @IsNumber()
  salary: number;

  @IsNumber()
  experience: number;

  @ValidateNested()
  @Type(() => GeoLocationDto)
  location: GeoLocationDto;
}
