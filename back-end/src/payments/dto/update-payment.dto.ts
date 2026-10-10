import { IsOptional, IsString } from 'class-validator';

export class UpdatePaymentDto {
  /** Filled on successful payment capture. */
  @IsOptional()
  @IsString()
  razorpayPaymentId?: string;

  /** HMAC-SHA256 signature, verified before setting. */
  @IsOptional()
  @IsString()
  razorpaySignature?: string;
}
