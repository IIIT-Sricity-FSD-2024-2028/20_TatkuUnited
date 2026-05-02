import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New quantity (min 1)', example: 2 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}
