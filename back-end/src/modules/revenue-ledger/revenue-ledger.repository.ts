import { Injectable } from '@nestjs/common';
import { DatabaseService, RevenueLedger } from '../../common/database/database.service';

@Injectable()
export class RevenueLedgerRepository {
  constructor(private readonly db: DatabaseService) {}

  findAll(): RevenueLedger[] {
    return this.db.revenueLedger;
  }

  findById(id: string): RevenueLedger | null {
    return this.db.revenueLedger.find((row) => row.ledger_id === id) || null;
  }

  findByBooking(bookingId: string): RevenueLedger[] {
    return this.db.revenueLedger.filter((row) => row.booking_id === bookingId);
  }

  findByProvider(spId: string): RevenueLedger[] {
    return this.db.revenueLedger.filter((row) => row.sp_id === spId);
  }

  findByUm(umId: string): RevenueLedger[] {
    return this.db.revenueLedger.filter((row) => row.um_id === umId);
  }

  findByCm(cmId: string): RevenueLedger[] {
    return this.db.revenueLedger.filter((row) => row.cm_id === cmId);
  }

  findByPayoutStatus(status: string): RevenueLedger[] {
    return this.db.revenueLedger.filter((row) => row.payout_status === status);
  }

  create(data: RevenueLedger): RevenueLedger {
    this.db.revenueLedger.push(data);
    this.db.save();
    return data;
  }

  update(id: string, patch: Partial<RevenueLedger>): RevenueLedger | null {
    const row = this.findById(id);
    if (!row) return null;
    Object.assign(row, patch);
    this.db.save();
    return row;
  }
  
  delete(id: string): RevenueLedger | null {
    const index = this.db.revenueLedger.findIndex((row) => row.ledger_id === id);
    if (index === -1) return null;
    const [deleted] = this.db.revenueLedger.splice(index, 1);
    this.db.save();
    return deleted;
  }
}
