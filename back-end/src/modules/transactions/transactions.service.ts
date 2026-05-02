import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TransactionsRepository } from './transactions.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  DatabaseService,
  Transaction,
} from '../../common/database/database.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '../../common/enums/role.enum';
import { AccessScopeService } from '../../common/access/access-scope.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly repo: TransactionsRepository,
    private readonly db: DatabaseService,
    private readonly accessScope: AccessScopeService,
  ) {}

  // ──────────────────────────── create ──────────────────────────────────────

  /**
   * Create a new transaction.
   * Guards:
   *   1. Duplicate idempotency key → ConflictException
   *   2. Booking already has a transaction → ConflictException
   */
  create(dto: CreateTransactionDto, user: JwtPayload): Transaction {
    const booking = this.findBooking(dto.booking_id);
    if (user.role === Role.CUSTOMER && booking.customer_id !== user.sub) {
      throw new ForbiddenException('Customers can only create transactions for their own bookings');
    }

    // 1. Idempotency guard
    const byKey = this.repo.findByIdempotencyKey(dto.idempotency_key);
    if (byKey) {
      throw new ConflictException('Duplicate idempotency key');
    }

    // 2. One-transaction-per-booking guard
    const byBooking = this.repo.findByBookingId(dto.booking_id);
    if (byBooking) {
      throw new ConflictException('Booking already has a transaction');
    }

    // 3. Build row
    const row: Transaction = {
      transaction_id: this.db.genId(),
      payment_gateway_ref: dto.payment_gateway_ref,
      payment_method: dto.payment_method,
      idempotency_key: dto.idempotency_key,
      payment_status: dto.payment_status,
      amount: dto.amount,
      currency: 'INR',
      refund_amount: dto.refund_amount ?? 0,
      refund_reason: dto.refund_reason ?? null,
      transaction_at: this.db.now(),
      verified_at: dto.verified_at ?? null,
      booking_id: dto.booking_id,
    };

    // 4. Persist and return
    return this.repo.create(row);
  }

  // ──────────────────────────── refund ──────────────────────────────────────

  /**
   * Refund a SUCCESS transaction.
   * State machine: SUCCESS → REFUNDED (terminal).
   * Also cancels the associated booking.
   */
  refund(id: string, reason: string): Transaction {
    const txn = this.repo.findById(id);
    if (!txn) {
      throw new NotFoundException(`Transaction with id "${id}" not found`);
    }
    if (txn.payment_status === 'REFUNDED') {
      throw new BadRequestException('Transaction already refunded');
    }
    if (txn.payment_status !== 'SUCCESS') {
      throw new BadRequestException(
        'Only SUCCESS transactions can be refunded',
      );
    }

    // Update transaction
    this.repo.update(id, {
      payment_status: 'REFUNDED',
      refund_amount: txn.amount,
      refund_reason: reason,
    });

    // Cancel the associated booking
    const booking = this.db.bookings.find(
      (b) => b.booking_id === txn.booking_id,
    );
    if (booking) {
      booking.status = 'CANCELLED';
      booking.updated_at = this.db.now();
    }

    return txn;
  }

  // ──────────────────────────── standard CRUD ──────────────────────────────

  /** Return all transactions. */
  findAll(): Transaction[] {
    return this.repo.findAll();
  }

  /** Find a single transaction by UUID. */
  findOne(id: string): Transaction {
    const row = this.repo.findById(id);
    if (!row) {
      throw new NotFoundException(`Transaction with id "${id}" not found`);
    }
    return row;
  }

  findOneScoped(id: string, user: JwtPayload): Transaction {
    const row = this.findOne(id);
    if (user.role === Role.UNIT_MANAGER) {
      const booking = this.findBooking(row.booking_id);
      this.accessScope.assertSectorAccess(user, booking.sector_id);
    }
    return row;
  }

  /** Find the transaction for a given booking. */
  findByBooking(bookingId: string): Transaction {
    const row = this.repo.findByBookingId(bookingId);
    if (!row) {
      throw new NotFoundException(
        `Transaction for booking "${bookingId}" not found`,
      );
    }
    return row;
  }

  findByBookingScoped(bookingId: string, user: JwtPayload): Transaction {
    const booking = this.findBooking(bookingId);
    if (user.role === Role.CUSTOMER && booking.customer_id !== user.sub) {
      throw new ForbiddenException(
        'Customers can only access their own booking transactions',
      );
    }
    if (user.role === Role.UNIT_MANAGER) {
      this.accessScope.assertSectorAccess(user, booking.sector_id);
    }
    return this.findByBooking(bookingId);
  }

  findBooking(bookingId: string) {
    const booking = this.db.bookings.find((row) => row.booking_id === bookingId);
    if (!booking) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }
    return booking;
  }

  /** Patch a transaction (used for webhook status updates). */
  update(id: string, dto: UpdateTransactionDto): Transaction {
    const row = this.repo.update(id, dto);
    if (!row) {
      throw new NotFoundException(`Transaction with id "${id}" not found`);
    }
    return row;
  }

  /**
   * Soft void — never hard-delete a transaction.
   * Sets payment_status to FAILED.
   */
  remove(id: string): Transaction {
    const row = this.repo.update(id, { payment_status: 'FAILED' });
    if (!row) {
      throw new NotFoundException(`Transaction with id "${id}" not found`);
    }
    return row;
  }
}
