import { IsBoolean, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SimulatePaymentDto {
  @ApiProperty({
    description: 'Mongo ObjectId of the order',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @IsMongoId()
  orderId: string;

  @ApiProperty({
    description: 'Whether mock payment succeeded',
    example: true,
  })
  @IsBoolean()
  success: boolean;
}
