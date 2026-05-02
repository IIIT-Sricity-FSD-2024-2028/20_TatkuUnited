import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { TIME_24H_REGEX } from '../../../common/validation/patterns';

export class UpdateWorkingHoursDto {
  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(TIME_24H_REGEX, { message: 'hour_start must be in HH:mm 24-hour format' })
  hour_start: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(TIME_24H_REGEX, { message: 'hour_end must be in HH:mm 24-hour format' })
  hour_end: string;
}
