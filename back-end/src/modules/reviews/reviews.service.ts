import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService, Review } from '../../common/database/database.service';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsRepository } from './reviews.repository';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly repo: ReviewsRepository,
    private readonly db: DatabaseService,
  ) {}

  create(dto: CreateReviewDto, customerId: string): Review {
    const booking = this.db.bookings.find((b) => b.booking_id === dto.booking_id);
    if (!booking) {
      throw new NotFoundException(`Booking with id "${dto.booking_id}" not found`);
    }
    if (booking.customer_id !== customerId) {
      throw new ForbiddenException('Customers can only review their own bookings');
    }
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('Reviews can only be created for completed bookings');
    }

    const bookingService = this.db.bookingServices.find(
      (bs) => bs.booking_id === dto.booking_id && bs.service_id === dto.service_id,
    );
    if (!bookingService) {
      throw new BadRequestException('Service was not part of this booking');
    }

    const completedAssignment = this.db.jobAssignments.find(
      (ja) =>
        ja.booking_id === dto.booking_id &&
        ja.service_id === dto.service_id &&
        ja.sp_id === dto.sp_id &&
        ja.status === 'COMPLETED',
    );
    if (!completedAssignment) {
      throw new BadRequestException('No completed assignment found for this provider and service');
    }

    const duplicate = this.db.reviews.find(
      (review) =>
        review.booking_id === dto.booking_id &&
        review.service_id === dto.service_id &&
        review.customer_id === customerId,
    );
    if (duplicate) {
      throw new BadRequestException('This booking service has already been reviewed');
    }

    const review = this.repo.create(dto, customerId);
    this.recalculateRatings(review.service_id, review.sp_id);
    return review;
  }

  findAll(): Review[] {
    return this.repo.findAll();
  }

  findOne(id: string, user: JwtPayload): Review {
    const review = this.repo.findById(id);
    this.assertCanRead(review, user);
    return review;
  }

  findByBooking(bookingId: string, user: JwtPayload): Review[] {
    const rows = this.repo.findByBooking(bookingId);
    rows.forEach((review) => this.assertCanRead(review, user));
    return rows;
  }

  findByProvider(spId: string, user: JwtPayload): Review[] {
    if (user.role === Role.SERVICE_PROVIDER && user.sub !== spId) {
      throw new ForbiddenException('Providers can only read their own reviews');
    }
    return this.repo.findByProvider(spId);
  }

  findByCustomer(customerId: string, user: JwtPayload): Review[] {
    if (user.role === Role.CUSTOMER && user.sub !== customerId) {
      throw new ForbiddenException('Customers can only read their own reviews');
    }
    return this.repo.findByCustomer(customerId);
  }

  findByService(serviceId: string): Review[] {
    // Service reviews are public to all authenticated users
    return this.repo.findByService(serviceId);
  }

  update(id: string, dto: UpdateReviewDto, user: JwtPayload): Review {
    const existing = this.repo.findById(id);
    if (user.role === Role.CUSTOMER && existing.customer_id !== user.sub) {
      throw new ForbiddenException('Customers can only update their own reviews');
    }
    const updated = this.repo.update(id, dto);
    this.recalculateRatings(updated.service_id, updated.sp_id);
    return updated;
  }

  remove(id: string, user: JwtPayload): Review {
    const existing = this.repo.findById(id);
    if (user.role === Role.CUSTOMER && existing.customer_id !== user.sub) {
      throw new ForbiddenException('Customers can only delete their own reviews');
    }
    const removed = this.repo.remove(id);
    this.recalculateRatings(removed.service_id, removed.sp_id);
    return removed;
  }

  private assertCanRead(review: Review, user: JwtPayload): void {
    if (user.role === Role.CUSTOMER && review.customer_id !== user.sub) {
      throw new ForbiddenException('Customers can only read their own reviews');
    }
    if (user.role === Role.SERVICE_PROVIDER && review.sp_id !== user.sub) {
      throw new ForbiddenException('Providers can only read their own reviews');
    }
  }

  private recalculateRatings(serviceId: string, providerId: string): void {
    const serviceReviews = this.db.reviews.filter((row) => row.service_id === serviceId);
    const service = this.db.services.find((row) => row.service_id === serviceId);
    if (service) {
      service.rating_count = serviceReviews.length;
      service.average_rating = this.average(serviceReviews);
    }

    const providerReviews = this.db.reviews.filter((row) => row.sp_id === providerId);
    const provider = this.db.serviceProviders.find((row) => row.sp_id === providerId);
    if (provider) {
      provider.rating_count = providerReviews.length;
      provider.rating = this.average(providerReviews);
      provider.updated_at = this.db.now();
    }
  }

  private average(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Number((total / reviews.length).toFixed(2));
  }
}
