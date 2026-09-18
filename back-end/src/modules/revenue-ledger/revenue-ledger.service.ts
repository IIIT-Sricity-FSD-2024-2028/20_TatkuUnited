import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RevenueLedgerRepository } from './revenue-ledger.repository';
import { CreateRevenueLedgerDto } from './dto/create-revenue-ledger.dto';
import { DatabaseService, JobAssignment } from '../../common/database/database.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AccessScopeService } from '../../common/access/access-scope.service';

@Injectable()
export class RevenueLedgerService {
  constructor(
    private readonly repo: RevenueLedgerRepository,
    private readonly db: DatabaseService,
    private readonly ps: PlatformSettingsService,
    private readonly accessScope: AccessScopeService,
  ) {}

  computeSplit(gross: number) {
    const spPct = this.ps.getNumericSetting('revenue_split_sp_percentage', 85);

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const sp = round2((gross * spPct) / 100);
    const platform = round2(gross - sp);

    return { provider_amount: sp, platform_amount: platform };
  }

  createPendingFromAssignment(assignment: JobAssignment) {
    // 1. Get price for this specific service in the booking
    const bsRow = this.db.bookingServices.find(
      (r) => r.booking_id === assignment.booking_id && r.service_id === assignment.service_id,
    );
    if (!bsRow) throw new NotFoundException('BookingService row not found');

    // 2. Validate service provider
    const sp = this.db.serviceProviders.find((p) => p.sp_id === assignment.sp_id);
    if (!sp) throw new NotFoundException('Service provider not found');

    // 3. Compute split on price_at_booking
    const split = this.computeSplit(bsRow.price_at_booking);

    // 4. Push ledger row
    const row = this.repo.create({
      ledger_id: this.db.genId(),
      payout_status: 'PENDING',
      created_at: this.db.now(),
      paid_at: null,
      booking_id: assignment.booking_id,
      service_id: assignment.service_id,
      sp_id: assignment.sp_id,
      ...split,
    });
    
    console.log(`RevenueLedgerService: Created pending entry ${row.ledger_id} for booking ${row.booking_id}`);
    return row;
  }

  dispatchForAssignment(assignment: JobAssignment) {
    const rows = this.repo
      .findByBooking(assignment.booking_id)
      .filter((r) => r.sp_id === assignment.sp_id && r.payout_status === 'PENDING')
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    const row = rows[0];
    if (!row) throw new NotFoundException('Pending ledger row not found');
    return this.repo.update(row.ledger_id, {
      payout_status: 'DISBURSED',
      paid_at: this.db.now(),
    });
  }

  getProviderEarnings(spId: string) {
    const rows = this.repo.findByProvider(spId);
    return {
      pending: rows
        .filter((r) => r.payout_status === 'PENDING')
        .reduce((s, r) => s + r.provider_amount, 0),
      disbursed: rows
        .filter((r) => r.payout_status === 'DISBURSED')
        .reduce((s, r) => s + r.provider_amount, 0),
      rows,
    };
  }

  getProviderEarningsScoped(spId: string, user: JwtPayload) {
    this.accessScope.assertProviderAccess(user, spId);
    return this.getProviderEarnings(spId);
  }

  getPlatformSummary() {
    const all = this.repo.findAll();
    return {
      total: all.reduce((s, r) => s + r.platform_amount, 0),
      pending: all
        .filter((r) => r.payout_status === 'PENDING')
        .reduce((s, r) => s + r.platform_amount, 0),
      disbursed: all
        .filter((r) => r.payout_status === 'DISBURSED')
        .reduce((s, r) => s + r.platform_amount, 0),
    };
  }

  dispatchPayout(ledgerId: string) {
    const row = this.repo.findById(ledgerId);
    if (!row) throw new NotFoundException();
    if (row.payout_status !== 'PENDING')
      throw new BadRequestException('only PENDING rows can be disbursed');
    return this.repo.update(ledgerId, { payout_status: 'DISBURSED', paid_at: this.db.now() });
  }

  create(dto: CreateRevenueLedgerDto) {
    return this.repo.create({
      ledger_id: this.db.genId(),
      payout_status: dto.payout_status || 'PENDING',
      created_at: this.db.now(),
      paid_at: dto.payout_status === 'DISBURSED' ? this.db.now() : null,
      booking_id: dto.booking_id,
      service_id: dto.service_id,
      sp_id: dto.sp_id,
      provider_amount: dto.provider_amount,
      platform_amount: dto.platform_amount,
    });
  }

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: string) {
    const row = this.repo.findById(id);
    if (!row) throw new NotFoundException();
    return row;
  }

  findOneScoped(id: string, user: JwtPayload) {
    const row = this.findOne(id);
    return row;
  }

  delete(id: string) {
    const row = this.repo.delete(id);
    if (!row) throw new NotFoundException();
    return row;
  }
}
