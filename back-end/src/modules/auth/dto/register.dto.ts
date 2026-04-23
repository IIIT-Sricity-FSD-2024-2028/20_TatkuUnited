import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'Aditya Verma' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: 'aditya.v@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '9812345678', description: '10 digit phone number' })
  @Matches(/^\d{10}$/)
  phone: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: [Role.CUSTOMER, Role.SERVICE_PROVIDER] })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({
    required: false,
    enum: ['individual', 'company'],
    description: 'Only used for service_provider registration',
  })
  @IsOptional()
  @IsString()
  providerType?: string;
}
