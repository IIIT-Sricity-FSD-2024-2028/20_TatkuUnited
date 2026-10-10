import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsMongoId()
  order: string;

  /** Must equal Order.totalAmount. In paise. */
  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsString()
  currency?: string; // defaults to "INR"

  /** Razorpay order id — unique. Used by the webhook to find this Payment. */
  @IsString()
  razorpayOrderId: string;
}
