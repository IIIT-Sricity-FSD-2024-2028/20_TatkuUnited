import { IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  /** One review per booking — enforced by unique index. */
  @IsMongoId()
  booking: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  review?: string;

  /** Copied from the booking so provider ratings can be aggregated directly. */
  @IsMongoId()
  provider: string;

  /** Copied from the booking so service ratings can be aggregated directly. */
  @IsMongoId()
  service: string;
}
