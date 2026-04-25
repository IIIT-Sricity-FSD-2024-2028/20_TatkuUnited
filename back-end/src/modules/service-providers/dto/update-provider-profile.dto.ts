import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

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
  dob?: string;

  @ApiProperty({ example: 'Female', required: false })
  @IsString()
  @IsOptional()
  gender?: string;

}
