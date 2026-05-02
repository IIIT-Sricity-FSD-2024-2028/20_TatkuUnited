import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JobAssignmentsRepository } from './job-assignments.repository';
import { BookingsRepository } from '../bookings/bookings.repository';
import { DatabaseService } from '../../common/database/database.service';
import { CompleteJobDto } from './dto/complete-job.dto';

@Injectable()
export class JobAssignmentsService {
  constructor(
    private readonly jaRepo: JobAssignmentsRepository,
    private readonly bookingsRepo: BookingsRepository,
    private readonly db: DatabaseService,
  ) {}

  // ── Auto-assign ────────────────────────────────────────

  autoAssign(bookingId: string) {
    // 1. Get booking
    const booking = this.bookingsRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundException(`Booking "${bookingId}" not found`);
    }

    // 2. Get booking services
    const bookingServices = this.bookingsRepo.findServicesByBooking(bookingId);
    if (bookingServices.length === 0) {
      throw new BadRequestException('Booking has no services');
    }

    const assignments: any[] = [];

    // 3. For each service line
    for (const bs of bookingServices) {
      // a. Find required skills for this service
      const requiredSkillIds = this.db.serviceSkills
        .filter((ss) => ss.service_id === bs.service_id)
        .map((ss) => ss.skill_id);

      // b. Find providers who have ALL required skills (verified)
      const qualifiedProviderIds = this.db.serviceProviders
        .filter((sp) => sp.is_active)
        .filter((sp) => {
          if (requiredSkillIds.length === 0) return true;
          const providerSkillIds = this.db.providerSkills
            .filter(
              (ps) =>
                ps.sp_id === sp.sp_id &&
                ps.verification_status.toLowerCase() === 'verified',
            )
            .map((ps) => ps.skill_id);
          return requiredSkillIds.every((sid) =>
            providerSkillIds.includes(sid),
          );
        });

      // c. Filter by sector (same sector as booking)
      let candidates = qualifiedProviderIds.filter(
        (sp) => sp.home_sector_id === booking.sector_id,
      );
      // Fallback: if no sector match, use all qualified
      if (candidates.length === 0) {
        candidates = qualifiedProviderIds;
      }

      // d. Filter by availability (check providerUnavailability for scheduled_date)
      const scheduledDate = booking.scheduled_at?.split('T')[0] || '';
      if (scheduledDate) {
        candidates = candidates.filter((sp) => {
          const unavailable = this.db.providerUnavailability.some(
            (pu) =>
              pu.sp_id === sp.sp_id &&
              pu.date === scheduledDate,
          );
          return !unavailable;
        });
      }

      // e. Sort by rating (highest first) — pick the best
      candidates.sort((a, b) => b.rating - a.rating);
      const bestProvider = candidates[0];

      if (!bestProvider) {
        throw new BadRequestException(
          `No qualified provider found for service "${bs.service_id}"`,
        );
      }

      // f. Get service info for duration
      const service = this.db.services.find(
        (s) => s.service_id === bs.service_id,
      );
      const durationMin = service?.estimated_duration_min || 60;

      // Calculate hour_end from hour_start + duration
      const hourStart = bestProvider.hour_start || '09:00';
      const [h, m] = hourStart.split(':').map(Number);
      const endMinutes = h * 60 + m + durationMin;
      const hourEnd = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

      // g. Create assignment
      const assignment = this.jaRepo.create({
        service_id: bs.service_id,
        scheduled_date: scheduledDate || this.db.now().split('T')[0],
        hour_start: hourStart,
        hour_end: hourEnd,
        status: 'ASSIGNED',
        assignment_score: null,
        notes: null,
        assigned_at: this.db.now(),
        booking_id: bookingId,
        sp_id: bestProvider.sp_id,
      });

      assignments.push(assignment);
    }

    // 4. Update booking status to ASSIGNED
    this.bookingsRepo.update(bookingId, { status: 'ASSIGNED' });

    return {
      booking_id: bookingId,
      status: 'ASSIGNED',
      assignments,
    };
  }

  // ── Mark complete ──────────────────────────────────────

  markComplete(assignmentId: string, dto: CompleteJobDto) {
    // 1. Find assignment
    const assignment = this.jaRepo.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException(`Assignment "${assignmentId}" not found`);
    }

    if (assignment.status === 'COMPLETED') {
      throw new BadRequestException('Assignment is already completed');
    }

    // 2. Set status → COMPLETED
    this.jaRepo.update(assignmentId, {
      status: 'COMPLETED',
      notes: dto.notes || assignment.notes,
    });

    // 3. Check if ALL assignments for this booking are COMPLETED
    const allForBooking = this.jaRepo.findByBooking(assignment.booking_id);
    const allComplete = allForBooking.every(
      (ja) => ja.status === 'COMPLETED',
    );

    if (allComplete) {
      // Set booking status → COMPLETED
      this.bookingsRepo.update(assignment.booking_id, { status: 'COMPLETED' });

      // 4. Trigger revenue split for each completed assignment
      this.createRevenueLedger(assignment.booking_id);
    }

    return this.jaRepo.findById(assignmentId);
  }

  private createRevenueLedger(bookingId: string) {
    // Look up platform_settings for split percentages
    const spPct = this.getSetting('sp_revenue_pct', 78);
    const umPct = this.getSetting('um_revenue_pct', 8);
    const cmPct = this.getSetting('cm_revenue_pct', 4);
    const platPct = this.getSetting('platform_revenue_pct', 10);

    // Calculate total booking amount
    const bookingServices = this.bookingsRepo.findServicesByBooking(bookingId);
    const totalAmount = bookingServices.reduce(
      (sum, bs) => sum + bs.price_at_booking * bs.quantity,
      0,
    );

    // Get assignments to find providers
    const assignments = this.jaRepo.findByBooking(bookingId);

    for (const ja of assignments) {
      // Find provider's unit manager and collective manager
      const provider = this.db.serviceProviders.find(
        (sp) => sp.sp_id === ja.sp_id,
      );
      // UnitManager is linked via unit_id
      const um = this.db.unitManagers?.find(
        (u) => u.unit_id === provider?.unit_id,
      );
      const umId = um?.um_id || '';
      // Unit → collective_id → CollectiveManager
      const unit = this.db.units?.find(
        (u) => u.unit_id === provider?.unit_id,
      );
      const cm = this.db.collectiveManagers?.find(
        (c) => c.collective_id === unit?.collective_id,
      );
      const cmId = cm?.cm_id || '';

      // Per-assignment amount (proportional to service price)
      const bs = bookingServices.find(
        (b) => b.service_id === ja.service_id,
      );
      const assignmentAmount = bs
        ? bs.price_at_booking * bs.quantity
        : totalAmount / assignments.length;

      this.db.revenueLedger.push({
        ledger_id: this.db.genId(),
        payout_status: 'PENDING',
        provider_amount: Math.round(assignmentAmount * spPct / 100),
        um_amount: Math.round(assignmentAmount * umPct / 100),
        cm_amount: Math.round(assignmentAmount * cmPct / 100),
        platform_amount: Math.round(assignmentAmount * platPct / 100),
        created_at: this.db.now(),
        paid_at: null,
        booking_id: bookingId,
        sp_id: ja.sp_id,
        um_id: umId,
        cm_id: cmId,
      });
    }
  }

  private getSetting(key: string, defaultVal: number): number {
    const setting = this.db.platformSettings?.find(
      (s) => s.key === key,
    );
    return setting ? Number(setting.value) : defaultVal;
  }

  // ── Queries ────────────────────────────────────────────

  findAll() {
    return this.jaRepo.findAll();
  }

  findByBooking(bookingId: string) {
    return this.jaRepo.findByBooking(bookingId);
  }

  findByProvider(spId: string) {
    return this.jaRepo.findByProvider(spId);
  }

  findOne(assignmentId: string) {
    const ja = this.jaRepo.findById(assignmentId);
    if (!ja) {
      throw new NotFoundException(`Assignment "${assignmentId}" not found`);
    }
    return ja;
  }
}
