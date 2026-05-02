import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { CartRepository } from '../cart/cart.repository';
import {
  DatabaseService,
  Booking,
  BookingService,
} from '../../common/database/database.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepo: BookingsRepository,
    private readonly cartRepo: CartRepository,
    private readonly db: DatabaseService,
  ) {}

  // ── Checkout ───────────────────────────────────────────

  checkout(customerId: string) {
    // 1. Find cart
    const cart = this.cartRepo.findCartByCustomer(customerId);
    if (!cart) {
      throw new BadRequestException('No cart found. Add items first.');
    }

    // 2. Get cart items
    const cartItems = this.cartRepo.findItemsByCart(cart.cart_id);
    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty. Add items first.');
    }

    // 3. Look up customer's sector
    const customer = this.db.customers.find(
      (c) => c.customer_id === customerId,
    );
    const sectorId = customer?.home_sector_id || '';

    // 4. Create booking
    const booking = this.bookingsRepo.create({
      booking_type: cart.booking_type,
      service_address: cart.service_address,
      scheduled_at: cart.scheduled_at || this.db.now(),
      status: 'PENDING',
      failure_reason: null,
      is_active: true,
      customer_id: customerId,
      sector_id: sectorId,
    });

    // 5. Create BookingService rows
    const bookingServices: BookingService[] = [];
    for (const item of cartItems) {
      const bs = this.bookingsRepo.addBookingService({
        booking_id: booking.booking_id,
        service_id: item.service_id,
        quantity: item.quantity,
        price_at_booking: item.price_snapshot,
      });
      bookingServices.push(bs);
    }

    // 6. Clear cart items (keep cart shell)
    this.cartRepo.clearCartItems(cart.cart_id);

    return { ...booking, services: bookingServices };
  }

  // ── Queries ────────────────────────────────────────────

  findAll() {
    return this.bookingsRepo.findAll();
  }

  findByCustomer(customerId: string) {
    return this.bookingsRepo.findByCustomer(customerId);
  }

  findBySector(sectorId: string) {
    return this.db.bookings.filter((b) => b.sector_id === sectorId);
  }

  findOne(bookingId: string) {
    const booking = this.bookingsRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundException(
        `Booking with id "${bookingId}" not found`,
      );
    }
    const services = this.bookingsRepo.findServicesByBooking(bookingId);
    return { ...booking, services };
  }

  // ── Cancel ─────────────────────────────────────────────

  cancel(bookingId: string) {
    const booking = this.bookingsRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundException(
        `Booking with id "${bookingId}" not found`,
      );
    }
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    const updated = this.bookingsRepo.update(bookingId, {
      status: 'CANCELLED',
      is_active: false,
      failure_reason: 'Customer cancelled',
    });

    return updated;
  }
}
