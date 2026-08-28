import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

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

  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({ example: 'Home Cleaning', required: false })
  @IsString()
  @IsOptional()
  service_category?: string;

  @ApiProperty({ example: '8', required: false })
  @IsString()
  @IsOptional()
  experience?: string;



  @ApiProperty({ example: ['skill-uuid'], required: false })
  @IsOptional()
  skills?: string[];
}
