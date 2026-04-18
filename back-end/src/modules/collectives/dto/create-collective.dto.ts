import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateCollectiveDto {
  @IsString()
  @IsNotEmpty()
  collective_name: string;

  @IsBoolean()
  is_active: boolean;
}
