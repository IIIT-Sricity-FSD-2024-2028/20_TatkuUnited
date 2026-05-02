import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsUUID,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({
    example: 'uuid-v4-booking-id',
    description: 'Associated booking',
  })
  @IsUUID()
  booking_id: string;

  @ApiProperty({
    example: 'PGR20260401001',
    description: 'Payment gateway reference ID',
  })
  @IsString()
  @IsNotEmpty()
  payment_gateway_ref: string;

  @ApiProperty({
    example: 'UPI',
    enum: ['UPI', 'CARD', 'NETBANK', 'WALLET'],
    description: 'Payment method used',
  })
  @IsEnum(['UPI', 'CARD', 'NETBANK', 'WALLET'])
  payment_method: string;

  @ApiProperty({
    example: 'idem-bkg001-001',
    description: 'Idempotency key to prevent duplicate processing',
  })
  @IsString()
  @IsNotEmpty()
  idempotency_key: string;

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    description: 'Initial payment status',
  })
  @IsEnum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'])
  payment_status: string;

  @ApiProperty({ example: 1299, description: 'Transaction amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    example: 0,
    description: 'Refund amount (if any)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refund_amount?: number;

  @ApiProperty({
    example: 'Customer requested cancellation',
    description: 'Reason for refund',
    required: false,
  })
  @IsOptional()
  @IsString()
  refund_reason?: string;

  @ApiProperty({
    example: '2026-04-01T16:34:20Z',
    description: 'Timestamp when gateway verified the payment',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  verified_at?: string;
}
