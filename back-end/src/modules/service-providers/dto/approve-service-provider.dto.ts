import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ApproveServiceProviderDto {
  @ApiProperty({ description: 'Unit ID to assign the provider to' })
  @IsUUID()
  unit_id: string;
}
