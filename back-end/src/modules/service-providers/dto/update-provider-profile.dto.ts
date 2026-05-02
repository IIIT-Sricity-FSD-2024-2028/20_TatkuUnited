import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { DATE_ONLY_REGEX } from '../../../common/validation/patterns';

export class UpdateProviderProfileDto {
  @ApiProperty({ example: 'Jane Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '9876543210', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsString()
  @IsOptional()
  @Matches(DATE_ONLY_REGEX, { message: 'dob must be in YYYY-MM-DD format' })
  dob?: string;

  @ApiProperty({ example: 'Female', required: false })
  @IsString()
  @IsOptional()
  gender?: string;

}
