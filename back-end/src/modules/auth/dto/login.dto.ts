import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class LoginDto {
  @ApiProperty({ example: 'aditya.v@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    example: 'customer',
    enum: Role,
    description: 'Optional when email is globally unique',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
