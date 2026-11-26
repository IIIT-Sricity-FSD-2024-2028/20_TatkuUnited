import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Gender, UserStatus } from '../../common/enums';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsEnum(['customer', 'provider', 'manager', 'admin'])
  role!: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
