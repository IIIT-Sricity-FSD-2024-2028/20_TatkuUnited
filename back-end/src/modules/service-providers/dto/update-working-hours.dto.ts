import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateWorkingHoursDto {
  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  hour_start: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @IsNotEmpty()
  hour_end: string;
}
