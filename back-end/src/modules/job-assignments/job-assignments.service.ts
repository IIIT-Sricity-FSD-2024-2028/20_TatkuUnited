import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JobAssignmentsRepository } from './job-assignments.repository';
import { BookingsRepository } from '../bookings/bookings.repository';
import { DatabaseService } from '../../common/database/database.service';
import { CompleteJobDto } from './dto/complete-job.dto';
import { RevenueLedgerService } from '../revenue-ledger/revenue-ledger.service';

@Injectable()
export class JobAssignmentsService {
  constructor(
    private readonly jaRepo: JobAssignmentsRepository,
    private readonly bookingsRepo: BookingsRepository,
    private readonly db: DatabaseService,
    private readonly revenueLedger: RevenueLedgerService,
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
    const maxConcurrent = 3;

    // 3. For each service line
    for (const bs of bookingServices) {
      // a. Find required skills for this service
      const requiredSkillIds = this.db.serviceSkills
        .filter((ss) => ss.service_id === bs.service_id)
        .map((ss) => ss.skill_id);

      const service = this.db.services.find(
        (s) => s.service_id === bs.service_id,
      );
      const durationMin = service?.estimated_duration_min || 60;

      const scheduledAtStr = bs.scheduled_at || this.db.now();
      let scheduledDate: string;
      let scheduledTime: string;

      if (scheduledAtStr.endsWith('Z')) {
        // Convert UTC string to IST by adding 5.5 hours
        const utcDate = new Date(scheduledAtStr);
        const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
        const istIso = istDate.toISOString();
        scheduledDate = istIso.split('T')[0];
        scheduledTime = istIso.split('T')[1].slice(0, 5);
      } else {
        // String is already IST (from our new db.now() or local input)
        scheduledDate = scheduledAtStr.split('T')[0];
        scheduledTime = scheduledAtStr.split('T')[1]?.slice(0, 5) || '';
      }

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

      const bookingSector = this.db.sectors.find(
        (s) => s.sector_id === booking.sector_id,
      );

      // c. Filter by unit's collective (same geography)
      // We allow providers from ANY sector in the same collective to ensure availability
      let candidates = qualifiedProviderIds.filter((sp) => {
        if (!bookingSector) return false;
        const unit = this.db.units.find((u) => u.unit_id === sp.unit_id);
        return !!unit && unit.collective_id === bookingSector.collective_id;
      });

      // d. Filter by availability, capacity, and schedule overlap
      candidates = candidates.filter((sp) => {
        const slotStart = this.toMinutes(scheduledTime || sp.hour_start);
        const slotEnd = slotStart + durationMin;
        const providerStart = this.toMinutes(sp.hour_start || '09:00');
        const providerEnd = this.toMinutes(sp.hour_end || '18:00');

        if (slotStart < providerStart || slotEnd > providerEnd) return false;

        const hasUnavailability = this.db.providerUnavailability.some((pu) => {
          if (pu.sp_id !== sp.sp_id) return false;
          if (!pu.date || pu.date !== scheduledDate) return false;
          const blockStart = this.toMinutes(pu.hour_start);
          const blockEnd = this.toMinutes(pu.hour_end);
          return this.overlaps(slotStart, slotEnd, blockStart, blockEnd);
        });

        if (hasUnavailability) return false;

        const activeAssignments = this.db.jobAssignments.filter(
          (ja) =>
            ja.sp_id === sp.sp_id &&
            ja.scheduled_date === scheduledDate &&
            ['ASSIGNED', 'IN_PROGRESS'].includes(ja.status),
        );

        if (activeAssignments.length >= maxConcurrent) return false;

        // Relaxed for simulation: allow multiple concurrent jobs up to maxConcurrent
        return true; 

      });

      const safetyCritical = this.isSafetyCritical(requiredSkillIds);

      const scoredCandidates = candidates
        .map((sp) => {
          const providerSkillIds = this.db.providerSkills
            .filter(
              (ps) =>
                ps.sp_id === sp.sp_id &&
                ps.verification_status.toLowerCase() === 'verified',
            )
            .map((ps) => ps.skill_id);

          const bonusSkillCount = providerSkillIds.filter(
            (sid) => !requiredSkillIds.includes(sid),
          ).length;

          const skillScore = requiredSkillIds.length === 0
            ? 1
            : Math.min(
                1,
                0.7 +
                  Math.min(
                    1,
                    bonusSkillCount / Math.max(1, requiredSkillIds.length),
                  ) *
                    0.3,
              );

          const ratingValue = sp.rating_count === 0 ? 3.5 : sp.rating;
          const ratingNorm = Math.max(
            0,
            Math.min(1, (ratingValue - 1) / 4),
          );

          // Proximity bonus: higher score if in the same sector
          const proximityNorm = sp.home_sector_id === booking.sector_id ? 1.0 : 0.6;

          const isNewProvider = sp.rating_count < 5;

          let w1 = 0.4;
          let w2 = 0.35;
          let w3 = 0.25;

          if (sp.rating_count >= 50) {
            w1 = 0.3;
            w2 = 0.45;
            w3 = 0.25;
          }

          if (safetyCritical) {
            w1 = 0.45;
            w2 = 0.35;
            w3 = 0.2;
          }

          const score = isNewProvider
            ? skillScore * proximityNorm
            : (skillScore * w1 + ratingNorm * w2 + proximityNorm * w3);

          return { provider: sp, score };
        })
        .sort((a, b) => b.score - a.score);

      const best = scoredCandidates[0];
      const bestProvider = best?.provider;

      if (!bestProvider) {
        const anyQualifiedForSkill = qualifiedProviderIds.length > 0;
        const timeMessage = anyQualifiedForSkill 
          ? " (Note: some providers are qualified but may be off-duty or fully booked at this time)"
          : "";
          
        throw new BadRequestException(
          `No qualified provider found for service "${service?.service_name || bs.service_id}" at the scheduled time in your area.${timeMessage}`,
        );
      }

      const hourStart = scheduledTime || bestProvider.hour_start || '09:00';
      const endMinutes = this.toMinutes(hourStart) + durationMin;
      const hourEnd = this.fromMinutes(endMinutes);

      // g. Create assignment
      const assignment = this.jaRepo.create({
        service_id: bs.service_id,
        scheduled_date: scheduledDate || this.db.now().split('T')[0],
        hour_start: hourStart,
        hour_end: hourEnd,
        status: 'ASSIGNED',
        assignment_score: best?.score ?? null,
        notes: null,
        assigned_at: this.db.now(),
        booking_id: bookingId,
        sp_id: bestProvider.sp_id,
      });

      this.revenueLedger.createPendingFromAssignment(assignment);

      assignments.push(this.enrichAssignment(assignment));
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

  async markComplete(assignmentId: string, dto: CompleteJobDto) {
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
    
    assignment.status = 'COMPLETED';
    assignment.updated_at = this.db.now();

    // 3. Trigger payout dispatch for this assignment
    this.revenueLedger.dispatchForAssignment(assignment);

    // 4. Check if ALL assignments for this booking are COMPLETED
    const allForBooking = this.jaRepo.findByBooking(assignment.booking_id);
    const allComplete = allForBooking.every(
      (ja) => ja.status === 'COMPLETED',
    );

    if (allComplete) {
      // Set booking status → COMPLETED
      this.bookingsRepo.update(assignment.booking_id, { status: 'COMPLETED' });
    }

    return this.jaRepo.findById(assignmentId) ? this.enrichAssignment(this.jaRepo.findById(assignmentId)) : null;
  }
  // ── Mark in-progress ───────────────────────────────────

  markInProgress(assignmentId: string) {
    const assignment = this.jaRepo.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException(`Assignment "${assignmentId}" not found`);
    }

    if (assignment.status === 'IN_PROGRESS') {
      throw new BadRequestException('Assignment is already in progress');
    }
    if (assignment.status === 'COMPLETED') {
      throw new BadRequestException('Cannot revert a completed assignment to in-progress');
    }

    this.jaRepo.update(assignmentId, { status: 'IN_PROGRESS' });
    assignment.status = 'IN_PROGRESS';
    assignment.updated_at = this.db.now();

    // Also update booking status if it's still ASSIGNED
    const booking = this.bookingsRepo.findById(assignment.booking_id);
    if (booking && booking.status === 'ASSIGNED') {
      this.bookingsRepo.update(assignment.booking_id, { status: 'IN_PROGRESS' });
    }

    return this.jaRepo.findById(assignmentId);
  }

  // ── Queries ────────────────────────────────────────────

  findAll() {
    return this.jaRepo.findAll().map((ja) => this.enrichAssignment(ja));
  }

  findByBooking(bookingId: string) {
    return this.jaRepo.findByBooking(bookingId).map((ja) => this.enrichAssignment(ja));
  }

  findBooking(bookingId: string) {
    const booking = this.bookingsRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundException(`Booking "${bookingId}" not found`);
    }
    return booking;
  }

  findByProvider(spId: string) {
    return this.jaRepo.findByProvider(spId).map((ja) => this.enrichAssignment(ja));
  }

  findOne(assignmentId: string) {
    const ja = this.jaRepo.findById(assignmentId);
    if (!ja) {
      throw new NotFoundException(`Assignment "${assignmentId}" not found`);
    }
    return this.enrichAssignment(ja);
  }

  private enrichAssignment(ja: any) {
    if (!ja) return ja;
    const provider = this.db.serviceProviders.find((sp) => sp.sp_id === ja.sp_id);
    const service = this.db.services.find((s) => s.service_id === ja.service_id);
    const booking = this.db.bookings.find((b) => b.booking_id === ja.booking_id);
    const bookingService = this.db.bookingServices.find(bs => bs.booking_id === ja.booking_id && bs.service_id === ja.service_id);
    const customer = booking
      ? this.db.customers.find((c) => c.customer_id === booking.customer_id)
      : null;
    return {
      ...ja,
      sp_name: provider?.name || 'Tatku Provider',
      sp_phone: provider?.phone || null,
      service_name: service?.service_name || 'Home Service',
      customer_name: customer?.full_name || 'Customer',
      customer_phone: customer?.phone || null,
      service_address: booking?.service_address || null,
      scheduled_at: bookingService?.scheduled_at || ja.assigned_at,
      estimated_duration_min: service?.estimated_duration_min || 60,
    };
  }


  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map((v) => parseInt(v, 10));
    return (h || 0) * 60 + (m || 0);
  }

  private fromMinutes(total: number): string {
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
    return Math.max(startA, startB) < Math.min(endA, endB);
  }

  private isSafetyCritical(requiredSkillIds: string[]): boolean {
    return this.db.skills
      .filter((s) => requiredSkillIds.includes(s.skill_id))
      .some((s) => s.skill_name.toLowerCase().includes('electrical'));
  }
}
