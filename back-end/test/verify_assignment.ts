
import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { JobAssignmentsService } from '../src/modules/job-assignments/job-assignments.service';
import { BookingsRepository } from '../src/modules/bookings/bookings.repository';
import { CartRepository } from '../src/modules/cart/cart.repository';
import { JobAssignmentsRepository } from '../src/modules/job-assignments/job-assignments.repository';
import { DatabaseService } from '../src/common/database/database.service';
import { RevenueLedgerService } from '../src/modules/revenue-ledger/revenue-ledger.service';

async function bootstrap() {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      BookingsService,
      JobAssignmentsService,
      BookingsRepository,
      CartRepository,
      JobAssignmentsRepository,
      DatabaseService,
      {
        provide: RevenueLedgerService,
        useValue: { createPendingFromAssignment: () => {} },
      },
    ],
  }).compile();

  const bookingsService = module.get<BookingsService>(BookingsService);
  const cartRepo = module.get<CartRepository>(CartRepository);
  const db = module.get<DatabaseService>(DatabaseService);

  const lakshmi = db.customers[1]; // Sector 1
  const acService = db.services[2]; // AC Repair

  console.log(`Testing booking for ${lakshmi.full_name} in sector ${lakshmi.home_sector_id}`);
  console.log(`AC provider Ravi is in sector ${db.serviceProviders[0].home_sector_id}`);

  // 1. Add item to cart
  const cart = cartRepo.createCart({
    booking_type: 'INSTANT',
    service_address: lakshmi.address,
    scheduled_at: db.now(),
    customer_id: lakshmi.customer_id,
  });

  cartRepo.addItem({
    cart_id: cart.cart_id,
    service_id: acService.service_id,
    quantity: 1,
    price_snapshot: acService.base_price,
  });

  // 2. Checkout
  try {
    console.log('Attempting checkout...');
    const result = bookingsService.checkout(lakshmi.customer_id);
    console.log('Checkout successful!');
    console.log('Assignments:', JSON.stringify(result.assignments, null, 2));
    
    if (result.assignments[0].sp_id === db.serviceProviders[0].sp_id) {
      console.log('SUCCESS: Assigned to Ravi from different sector (same collective).');
    } else {
      console.log('FAILURE: Not assigned to Ravi.');
    }

    if (result.assignments[0].sp_name === 'Ravi Kumar') {
      console.log('SUCCESS: Assignment enriched with provider name.');
    } else {
      console.log('FAILURE: Assignment NOT enriched.');
    }
  } catch (err) {
    console.error('Checkout failed:', err.message);
  }
}

bootstrap();
