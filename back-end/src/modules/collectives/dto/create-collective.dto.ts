import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateCollectiveDto {
  @ApiProperty({ example: 'South Chennai Collective' })
  @IsString()
  @IsNotEmpty()
  collective_name: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;
}
