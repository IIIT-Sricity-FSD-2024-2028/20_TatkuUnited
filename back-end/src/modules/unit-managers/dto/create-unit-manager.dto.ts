import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUnitManagerDto {
  @ApiProperty({ example: 'unitmanager@tatku.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Jane Unit' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'unit-uuid', required: false })
  @IsUUID()
  @IsOptional()
  unit_id?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsString()
  @IsOptional()
  dob?: string;

  @ApiProperty({ example: 'data:image/png;base64,...', required: false })
  @IsString()
  @IsOptional()
  pfp_url?: string;
}
