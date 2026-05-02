import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsUUID()
  @IsNotEmpty()
  booking_id: string;

  @IsUUID()
  @IsNotEmpty()
  service_id: string;

  @IsUUID()
  @IsNotEmpty()
  sp_id: string;
}
