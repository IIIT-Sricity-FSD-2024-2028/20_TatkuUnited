import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { CartRepository } from '../cart/cart.repository';
import { JobAssignmentsService } from '../job-assignments/job-assignments.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CheckoutBookingDto } from './dto/checkout-booking.dto';
import { Role } from '../../common/enums/role.enum';
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
    private readonly transactionsService: TransactionsService,
    @Inject(forwardRef(() => JobAssignmentsService))
    private readonly jobAssignmentsService: JobAssignmentsService,
  ) {}

  // ── Checkout ───────────────────────────────────────────

  checkout(customerId: string, dto: CheckoutBookingDto = {}) {
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
    const amount = cartItems.reduce(
      (sum, item) => sum + item.price_snapshot * item.quantity,
      0,
    );

    for (const item of cartItems) {
      const bs = this.bookingsRepo.addBookingService({
        booking_id: booking.booking_id,
        service_id: item.service_id,
        quantity: item.quantity,
        price_at_booking: item.price_snapshot,
      });
      bookingServices.push(bs);
    }

    // 6. Create transaction for the checked-out booking
    const paymentMethod = this.normalizePaymentMethod(dto.payment_method);
    const transaction = this.transactionsService.create(
      {
        booking_id: booking.booking_id,
        payment_gateway_ref:
          dto.payment_gateway_ref || `PGR-${booking.booking_id}`,
        payment_method: paymentMethod,
        idempotency_key:
          dto.idempotency_key || `idem-checkout-${booking.booking_id}`,
        payment_status: 'SUCCESS',
        amount,
        refund_amount: 0,
        verified_at: this.db.now(),
      },
      {
        sub: customerId,
        email: customer?.email || '',
        role: Role.CUSTOMER,
        name: customer?.full_name || '',
      },
    );

    // 7. Auto-assign providers
    const assignmentResult = this.jobAssignmentsService.autoAssign(
      booking.booking_id,
    );

    // 8. Clear cart items (keep cart shell)
    this.cartRepo.clearCartItems(cart.cart_id);

    return {
      ...booking,
      services: bookingServices,
      transaction,
      assignments: assignmentResult.assignments,
    };
  }

  private normalizePaymentMethod(method?: string): 'UPI' | 'CARD' | 'NETBANK' | 'WALLET' {
    const normalized = String(method || 'CARD').trim().toUpperCase();
    if (normalized === 'UPI') return 'UPI';
    if (normalized === 'CARD') return 'CARD';
    if (normalized === 'NETBANK' || normalized === 'NETBANKING') return 'NETBANK';
    if (normalized === 'WALLET') return 'WALLET';
    return 'CARD';
  }

  // ── Queries ────────────────────────────────────────────

  findAll() {
    return this.bookingsRepo.findAll();
  }

  findByCustomer(customerId: string) {
    return this.bookingsRepo.findByCustomer(customerId);
  }

  findByProvider(providerId: string) {
    return this.bookingsRepo.findByProvider(providerId);
  }

  findAssignmentsByBooking(bookingId: string) {
    return this.db.jobAssignments.filter((row) => row.booking_id === bookingId);
  }

  findByProviderAssignmentsForUnit(unitId: string) {
    return this.db.serviceProviders.filter((provider) => provider.unit_id === unitId);
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
    const rawServices = this.bookingsRepo.findServicesByBooking(bookingId);
    const services = rawServices.map((bs) => {
      const svc = this.db.services.find((s) => s.service_id === bs.service_id);
      return {
        ...bs,
        service_name: svc?.service_name || 'Service',
        service: svc?.service_name || 'Service',
        price: bs.price_at_booking,
      };
    });
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
