import { Type } from 'class-transformer';
import {
  IsDateString,
  IsMongoId,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { AddressSnapshotDto } from '../../common/dto/geo-location.dto';

export class CreateOrderDto {
  @IsMongoId()
  customer: string;

  /** Address snapshot copied from User.addresses at checkout — never update after creation. */
  @ValidateNested()
  @Type(() => AddressSnapshotDto)
  address: AddressSnapshotDto;

  /** Sum of all booking prices, in paise. */
  @IsNumber()
  totalAmount: number;

  /** Order creation time + 15 minutes. Unpaid orders expire and release slots. */
  @IsDateString()
  expiresAt: string;
}
