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

import { PlatformSettingsService } from '../platform-settings/platform-settings.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepo: BookingsRepository,
    private readonly cartRepo: CartRepository,
    private readonly db: DatabaseService,
    private readonly transactionsService: TransactionsService,
    private readonly platformSettings: PlatformSettingsService,
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
    
    // 2.3. Check for Instant Booking setting
    const hasInstant = cartItems.some(item => item.booking_type === 'INSTANT');
    if (hasInstant) {
      const isInstantAllowed = this.platformSettings.getBooleanSetting('instant_booking', true);
      if (!isInstantAllowed) {
        throw new BadRequestException('Instant booking is currently disabled by the platform.');
      }
    }

    // 2.5. Check if address is present
    if (!cart.service_address || cart.service_address.trim() === '') {
      throw new BadRequestException('Service address is required for checkout.');
    }

    // 3. Look up customer's sector
    const customer = this.db.customers.find(
      (c) => c.customer_id === customerId,
    );
    const sectorId = customer?.home_sector_id || '';

    // 4. Create one booking per cart item (each service is an independent booking)
    const paymentMethod = this.normalizePaymentMethod(dto.payment_method);
    const createdBookings: any[] = [];

    for (const item of cartItems) {
      const itemAmount = item.price_snapshot * item.quantity;

      // Create individual booking
      const booking = this.bookingsRepo.create({
        service_address: cart.service_address,
        status: 'PENDING',
        failure_reason: null,
        is_active: true,
        customer_id: customerId,
        sector_id: sectorId,
      });

      // Create single BookingService row
      const bs = this.bookingsRepo.addBookingService({
        booking_id: booking.booking_id,
        service_id: item.service_id,
        quantity: item.quantity,
        price_at_booking: item.price_snapshot,
        booking_type: item.booking_type,
        scheduled_at: item.scheduled_at || null,
      });

      // Create transaction for this booking
      const transaction = this.transactionsService.create(
        {
          booking_id: booking.booking_id,
          payment_gateway_ref:
            dto.payment_gateway_ref || `PGR-${booking.booking_id}`,
          payment_method: paymentMethod,
          idempotency_key:
            dto.idempotency_key || `idem-checkout-${booking.booking_id}`,
          payment_status: 'SUCCESS',
          amount: itemAmount,
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

      // Auto-assign provider for this booking
      const assignmentResult = this.jobAssignmentsService.autoAssign(
        booking.booking_id,
      );

      createdBookings.push({
        ...booking,
        services: [bs],
        transaction,
        assignments: assignmentResult.assignments,
      });
    }

    // 5. Clear cart items (keep cart shell)
    this.cartRepo.clearCartItems(cart.cart_id);

    // Return the first booking for backwards-compatibility, but include all
    return createdBookings.length === 1
      ? createdBookings[0]
      : { bookings: createdBookings, count: createdBookings.length };
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
    const rawBookings = this.bookingsRepo.findByCustomer(customerId);
    const result: any[] = [];

    for (const b of rawBookings) {
      const services = this.bookingsRepo.findServicesByBooking(b.booking_id);
      const assignments = this.jobAssignmentsService.findByBooking(b.booking_id);

      if (services.length === 0) {
        // No service lines — return the booking shell as-is
        result.push({
          ...b,
          service_name: 'Home Service',
          sp_name: 'Awaiting assignment',
          sp_phone: null,
          price: 0,
          scheduled_at: b.created_at,
        });
        continue;
      }

      // Flatten: one result row per service line in the booking
      for (const bs of services) {
        const svc = this.db.services.find(
          (x) => x.service_id === bs.service_id,
        );

        // Find the assignment for THIS specific service in this booking
        const assignment = assignments.find(
          (a) => a.service_id === bs.service_id,
        );

        let sp_name = 'Awaiting assignment';
        let sp_phone: string | null = null;
        if (assignment) {
          const provider = this.db.serviceProviders.find(
            (p) => p.sp_id === assignment.sp_id,
          );
          sp_name = provider?.name || 'Awaiting assignment';
          sp_phone = provider?.phone || null;
        }

        result.push({
          ...b,
          // Use a composite ID so each service line is uniquely identifiable
          booking_id: services.length > 1
            ? `${b.booking_id}__${bs.service_id}`
            : b.booking_id,
          service_name: svc?.service_name || 'Home Service',
          sp_name,
          sp_phone,
          price: bs.price_at_booking * bs.quantity,
          scheduled_at: bs.scheduled_at || b.created_at,
        });
      }
    }

    return result;
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
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }

    const services = this.bookingsRepo
      .findServicesByBooking(bookingId)
      .map((bs) => {
        const s = this.db.services.find((x) => x.service_id === bs.service_id);
        return { ...bs, service_name: s?.service_name || 'Unknown Service' };
      });

    const assignments = this.jobAssignmentsService
      .findByBooking(bookingId)
      .map((ja) => {
        const provider = this.db.serviceProviders.find(
          (p) => p.sp_id === ja.sp_id,
        );
        const s = this.db.services.find((x) => x.service_id === ja.service_id);
        return {
          ...ja,
          sp_name: provider?.name || 'Tatku Provider',
          sp_phone: provider?.phone || null,
          service_name: s?.service_name || 'Home Service',
        };
      });

    // Determine a primary service name for the booking
    const service_name =
      services.length > 0 ? services[0].service_name : 'Home Service';
    const price = services.reduce((sum, s) => sum + s.price_at_booking, 0);

    return { ...booking, service_name, price, services, assignments };
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

    // Also cancel all active job assignments for this booking
    const assignments = this.db.jobAssignments.filter(
      (ja) => ja.booking_id === bookingId && ja.status !== 'COMPLETED',
    );
    for (const ja of assignments) {
      ja.status = 'CANCELLED';
      ja.updated_at = this.db.now();
    }

    return updated;
  }
}
