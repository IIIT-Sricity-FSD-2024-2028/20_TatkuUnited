import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums/roles.enum';

export class RegisterDto {
  @ApiPropertyOptional({
    example: 'Rahul Sharma',
    description: 'User full name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Rahul Sharma',
    description: 'Alternative field for full name supported by frontend forms',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    example: 'rahul.sharma@example.com',
    description: 'Unique email address',
  })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePass@123',
    description: 'Account password (minimum 8 characters)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'Unique mobile phone number',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({
    enum: Role,
    default: Role.CUSTOMER,
    description: 'Assigned platform role (customer, provider, manager, admin)',
  })
  @IsOptional()
  role?: Role | string = Role.CUSTOMER;

  @ApiPropertyOptional({
    example: 'male',
    enum: ['male', 'female', 'other'],
    description: 'Demographic gender',
  })
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({
    example: '1995-05-20',
    description: 'Date of birth in ISO format',
  })
  @IsOptional()
  dob?: string;
}
