import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, Review } from '../../common/database/database.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsRepository {
  constructor(private readonly db: DatabaseService) {}

  findAll(): Review[] {
    return this.db.reviews;
  }

  findById(id: string): Review {
    const review = this.db.reviews.find((row) => row.review_id === id);
    if (!review) {
      throw new NotFoundException(`Review with id "${id}" not found`);
    }
    return review;
  }

  findByBooking(bookingId: string): Review[] {
    return this.db.reviews.filter((row) => row.booking_id === bookingId);
  }

  findByProvider(spId: string): Review[] {
    return this.db.reviews.filter((row) => row.sp_id === spId);
  }

  findByCustomer(customerId: string): Review[] {
    return this.db.reviews.filter((row) => row.customer_id === customerId);
  }

  findByService(serviceId: string): Review[] {
    return this.db.reviews.filter((row) => row.service_id === serviceId);
  }

  create(dto: CreateReviewDto, customerId: string): Review {
    const review: Review = {
      review_id: this.db.genId(),
      rating: dto.rating,
      comment: dto.comment || '',
      created_at: this.db.now(),
      booking_id: dto.booking_id,
      service_id: dto.service_id,
      customer_id: customerId,
      sp_id: dto.sp_id,
    };
    this.db.reviews.push(review);
    return review;
  }

  update(id: string, dto: UpdateReviewDto): Review {
    const review = this.findById(id);
    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.comment !== undefined) review.comment = dto.comment;
    return review;
  }

  remove(id: string): Review {
    const index = this.db.reviews.findIndex((row) => row.review_id === id);
    if (index < 0) {
      throw new NotFoundException(`Review with id "${id}" not found`);
    }
    const [removed] = this.db.reviews.splice(index, 1);
    return removed;
  }
}
