import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ApproveServiceProviderDto {
  @ApiProperty({ description: 'Region ID to assign the provider to' })
  @IsString()
  region_id: string;
}
