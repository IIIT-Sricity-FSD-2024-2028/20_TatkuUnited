import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'customer@tatku.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({ example: '123 Main St, Chennai' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'sector-uuid' })
  @IsString()
  @IsOptional()
  home_sector_id?: string;

  @ApiProperty({
    example: [{ id: 1, tag: 'Home', text: '123 Main St' }],
    required: false,
  })
  @IsOptional()
  saved_addresses?: any[];
}
