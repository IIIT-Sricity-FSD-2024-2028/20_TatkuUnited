import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateServiceProviderDto {
  @ApiProperty({ example: 'provider@tatku.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Provider' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'unit-uuid' })
  @IsString()
  @IsNotEmpty()
  unit_id: string;

  @ApiProperty({ example: 'sector-uuid' })
  @IsString()
  @IsNotEmpty()
  sector_id: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;
}
