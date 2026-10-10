import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateBookingDto {
  @IsOptional()
  @IsEnum([
    'pending',
    'awaiting_provider',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
  ])
  status?: string;

  /** Reassignment: new provider. */
  @IsOptional()
  @IsMongoId()
  provider?: string;

  @IsOptional()
  @IsEnum(['customer', 'provider', 'manager', 'admin', 'system'])
  cancelledBy?: string;

  @IsOptional()
  @IsString()
  cancelledReason?: string;

  /** Set while status is awaiting_provider; cleared on accept or cancel. */
  @IsOptional()
  @IsDateString()
  offerExpiresAt?: string;

  @IsOptional()
  @IsEnum(['pending', 'paid'])
  payoutStatus?: string;

  @IsOptional()
  @IsDateString()
  payoutAt?: string;
}
