import { Injectable } from '@nestjs/common';
import {
  DatabaseService,
  Transaction,
} from '../../common/database/database.service';

@Injectable()
export class TransactionsRepository {
  constructor(private readonly db: DatabaseService) {}

  /** Return every transaction. */
  findAll(): Transaction[] {
    return this.db.transactions;
  }

  /** Find a single transaction by its UUID. Returns the row or null. */
  findById(id: string): Transaction | null {
    return (
      this.db.transactions.find((row) => row.transaction_id === id) ?? null
    );
  }

  /** Find the transaction for a given booking (unique — one txn per booking). */
  findByBookingId(bookingId: string): Transaction | null {
    return (
      this.db.transactions.find((row) => row.booking_id === bookingId) ?? null
    );
  }

  /** Find a transaction by its idempotency key. */
  findByIdempotencyKey(key: string): Transaction | null {
    return (
      this.db.transactions.find((row) => row.idempotency_key === key) ?? null
    );
  }

  /** Filter transactions by payment_status. */
  findByStatus(status: string): Transaction[] {
    return this.db.transactions.filter(
      (row) => row.payment_status === status,
    );
  }

  /** Push a new transaction into the in-memory store. */
  create(data: Transaction): Transaction {
    this.db.transactions.push(data);
    this.db.save();
    return data;
  }

  /** Find by transaction_id, merge patch via Object.assign, return updated row. */
  update(id: string, patch: Partial<Transaction>): Transaction | null {
    const row = this.findById(id);
    if (!row) return null;
    Object.assign(row, patch);
    this.db.save();
    return row;
  }
}
