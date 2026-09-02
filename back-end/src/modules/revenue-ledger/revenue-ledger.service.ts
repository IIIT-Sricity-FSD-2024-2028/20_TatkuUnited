import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RevenueLedgerRepository } from './revenue-ledger.repository';
import { CreateRevenueLedgerDto } from './dto/create-revenue-ledger.dto';
import { DatabaseService, JobAssignment } from '../../common/database/database.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '../../common/enums/role.enum';
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
    const bsRow = this.db.bookingServices.find(
      (r) => r.booking_id === assignment.booking_id && r.service_id === assignment.service_id,
    );
    if (!bsRow) throw new NotFoundException('BookingService row not found');

    const sp = this.db.serviceProviders.find((p) => p.sp_id === assignment.sp_id);
    if (!sp) throw new NotFoundException('Service provider not found');
    
    let rm = this.db.regionManagers.find((m) => m.region_id === sp.region_id);
    if (!rm) {
      rm = this.db.regionManagers[0];
    }
    const rmId = rm ? rm.rm_id : '';

    const split = this.computeSplit(bsRow.price_at_booking);

    const row = this.repo.create({
      ledger_id: this.db.genId(),
      payout_status: 'PENDING',
      created_at: this.db.now(),
      paid_at: null,
      booking_id: assignment.booking_id,
      service_id: assignment.service_id,
      sp_id: assignment.sp_id,
      rm_id: rmId,
      ...split,
    });
    
    console.log(`RevenueLedgerService: Created pending entry ${row.ledger_id} for booking ${row.booking_id} (RM: ${row.rm_id})`);
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

  getRmEarnings(rmId: string) {
    const rows = this.repo.findByRm(rmId).map((row) => {
      const assignment = this.db.jobAssignments.find(
        (item) => item.booking_id === row.booking_id && item.sp_id === row.sp_id,
      );
      const serviceId = row.service_id || assignment?.service_id;
      const service = this.db.services.find((item) => item.service_id === serviceId);
      const category = this.db.categories.find(
        (item) => item.category_id === service?.category_id,
      );
      const booking = this.db.bookings.find(
        (item) => item.booking_id === row.booking_id,
      );
      const customer = this.db.customers.find(
        (item) => item.customer_id === booking?.customer_id,
      );
      return {
        ...row,
        service_id: serviceId,
        category_id: category?.category_id,
        category_name: category?.category_name,
        customer_name: customer?.full_name,
      };
    });
    return {
      pending: rows
        .filter((r) => r.payout_status === 'PENDING')
        .reduce((s, r) => s + r.provider_amount + r.platform_amount, 0),
      disbursed: rows
        .filter((r) => r.payout_status === 'DISBURSED')
        .reduce((s, r) => s + r.provider_amount + r.platform_amount, 0),
      rows,
    };
  }

  getRmEarningsScoped(rmId: string, user: JwtPayload) {
    if (user.role === Role.REGION_MANAGER && user.sub !== rmId) {
      throw new NotFoundException('Region manager earnings not found');
    }
    return this.getRmEarnings(rmId);
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
      rm_id: dto.rm_id,
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
    if (user.role === Role.REGION_MANAGER) {
      const rm = this.accessScope.getRegionManager(user.sub);
      this.accessScope.assertRegionAccess(user, rm.region_id);
    }
    return row;
  }

  delete(id: string) {
    const row = this.repo.delete(id);
    if (!row) throw new NotFoundException();
    return row;
  }
}
