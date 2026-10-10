import { IsEnum, IsMongoId, IsOptional } from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(['created', 'paid', 'failed', 'refunded', 'partially_refunded'])
  paymentStatus?: string;

  @IsOptional()
  @IsMongoId()
  payment?: string;
}
