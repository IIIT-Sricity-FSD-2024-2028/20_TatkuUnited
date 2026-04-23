import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ApproveServiceProviderDto {
  @ApiProperty({ description: 'Unit ID to assign the provider to' })
  @IsString()
  @MinLength(1)
  unit_id: string;
}
