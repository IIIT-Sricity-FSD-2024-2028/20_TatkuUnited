import { IsUUID, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRevenueLedgerDto {
  @ApiProperty({ example: 'b123-uuid', description: 'Associated booking ID' })
  @IsUUID() booking_id: string;

  @ApiProperty({ example: 'svc-uuid', description: 'Associated service ID' })
  @IsUUID() service_id: string;

  @ApiProperty({ example: 'sp123-uuid', description: 'Service Provider ID' })
  @IsUUID() sp_id: string;

  @ApiProperty({ example: 'um123-uuid', description: 'Unit Manager ID' })
  @IsUUID() um_id: string;

  @ApiProperty({ example: 'cm123-uuid', description: 'Collective Manager ID' })
  @IsUUID() cm_id: string;

  @ApiProperty({ example: 1013.22, description: 'Provider amount' })
  @IsNumber() @Min(0) provider_amount: number;

  @ApiProperty({ example: 103.92, description: 'Unit Manager amount' })
  @IsNumber() @Min(0) um_amount: number;

  @ApiProperty({ example: 51.96, description: 'Collective Manager amount' })
  @IsNumber() @Min(0) cm_amount: number;

  @ApiProperty({ example: 129.90, description: 'Platform amount' })
  @IsNumber() @Min(0) platform_amount: number;

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'DISBURSED', 'FAILED', 'HELD'], description: 'Payout status', required: false })
  @IsOptional()
  @IsEnum(['PENDING', 'DISBURSED', 'FAILED', 'HELD'])
  payout_status?: string;
}
