import { Injectable } from '@nestjs/common';
import {
  DatabaseService,
  Booking,
  BookingService,
} from '../../common/database/database.service';

@Injectable()
export class BookingsRepository {
  constructor(private readonly db: DatabaseService) {}

  findAll(): Booking[] {
    return this.db.bookings;
  }

  findById(booking_id: string): Booking | undefined {
    return this.db.bookings.find((b) => b.booking_id === booking_id);
  }

  findByCustomer(customer_id: string): Booking[] {
    return this.db.bookings.filter((b) => b.customer_id === customer_id);
  }

  findByProvider(sp_id: string): Booking[] {
    const assignedBookingIds = this.db.jobAssignments
      .filter((ja) => ja.sp_id === sp_id)
      .map((ja) => ja.booking_id);
    return this.db.bookings.filter((b) =>
      assignedBookingIds.includes(b.booking_id),
    );
  }

  create(
    data: Omit<Booking, 'booking_id' | 'created_at' | 'updated_at'>,
  ): Booking {
    const booking: Booking = {
      ...data,
      booking_id: this.db.genId(),
      created_at: this.db.now(),
      updated_at: this.db.now(),
    };
    this.db.bookings.push(booking);
    return booking;
  }

  update(booking_id: string, data: Partial<Booking>): Booking | undefined {
    const idx = this.db.bookings.findIndex((b) => b.booking_id === booking_id);
    if (idx === -1) return undefined;
    this.db.bookings[idx] = {
      ...this.db.bookings[idx],
      ...data,
      updated_at: this.db.now(),
    };
    return this.db.bookings[idx];
  }

  delete(booking_id: string): boolean {
    const idx = this.db.bookings.findIndex((b) => b.booking_id === booking_id);
    if (idx === -1) return false;
    this.db.bookings.splice(idx, 1);
    return true;
  }

  // Booking services (junction)
  findServicesByBooking(booking_id: string): BookingService[] {
    return this.db.bookingServices.filter((bs) => bs.booking_id === booking_id);
  }

  addBookingService(data: BookingService): BookingService {
    this.db.bookingServices.push(data);
    return data;
  }
}
