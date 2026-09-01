import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRevenueLedgerDto {
  @ApiProperty({ example: 'bkg-123' })
  @IsString()
  @IsNotEmpty()
  booking_id: string;

  @ApiProperty({ example: 'svc-123' })
  @IsString()
  @IsNotEmpty()
  service_id: string;

  @ApiProperty({ example: 'sp-123' })
  @IsString()
  @IsNotEmpty()
  sp_id: string;

  @ApiProperty({ example: 'rm-123' })
  @IsString()
  @IsNotEmpty()
  rm_id: string;

  @ApiProperty({ example: 850 })
  @IsNumber()
  provider_amount: number;

  @ApiProperty({ example: 150 })
  @IsNumber()
  platform_amount: number;

  @ApiPropertyOptional({ example: 'PENDING', default: 'PENDING' })
  @IsString()
  @IsOptional()
  payout_status?: string;
}
