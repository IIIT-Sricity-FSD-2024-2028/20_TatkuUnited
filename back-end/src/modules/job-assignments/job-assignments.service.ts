import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JobAssignmentsRepository } from './job-assignments.repository';
import { BookingsRepository } from '../bookings/bookings.repository';
import { CreateJobAssignmentDto } from './dto/create-job-assignment.dto';
import { UpdateJobAssignmentDto } from './dto/update-job-assignment.dto';
import { DatabaseService, JobAssignment } from '../../common/database/database.service';
import { RevenueLedgerService } from '../revenue-ledger/revenue-ledger.service';
import { AccessScopeService } from '../../common/access/access-scope.service';

@Injectable()
export class JobAssignmentsService {
  constructor(
    private readonly repo: JobAssignmentsRepository,
    @Inject(forwardRef(() => BookingsRepository))
    private readonly bookingsRepo: BookingsRepository,
    private readonly db: DatabaseService,
    private readonly revenueLedgerService: RevenueLedgerService,
    private readonly accessScope: AccessScopeService,
  ) {}

  // ── Availability Checking ──────────────────────────────

  checkAvailability(serviceId: string, scheduledAt: string | null, pendingAssignments: any[] = []) {
    const scheduledAtStr = scheduledAt || this.db.now();
    const result = this.findBestProvider(serviceId, scheduledAtStr, pendingAssignments);

    if (!result.best) {
      const timeMessage = result.anyQualified
        ? ' (some providers are qualified but may be off-duty or fully booked at this time)'
        : '';
      return {
        available: false,
        serviceName: result.serviceName,
        reason: `No qualified provider found for "${result.serviceName}" at the scheduled time.${timeMessage}`,
      };
    }

    const hourStart = result.scheduledTime || result.best.provider.hour_start || '09:00';
    const endMinutes = this.toMinutes(hourStart) + result.durationMin;
    const hourEnd = this.fromMinutes(endMinutes);

    return {
      available: true,
      serviceName: result.serviceName,
      simulatedAssignment: {
        sp_id: result.best.provider.sp_id,
        scheduled_date: result.scheduledDate,
        hour_start: hourStart,
        hour_end: hourEnd,
      }
    };
  }

  findBestProvider(serviceId: string, scheduledAtStr: string, pendingAssignments: any[] = []) {
    const service = this.db.services.find(s => s.service_id === serviceId);
    if (!service) return { best: null, anyQualified: false, serviceName: 'Unknown', durationMin: 60 };

    const durationMin = service.estimated_duration_min || 60;
    
    // a. required skills
    const requiredSkillIds = this.db.serviceSkills
      .filter((ss) => ss.service_id === serviceId)
      .map((ss) => ss.skill_id);

    // b. qualified providers
    let qualifiedProviderIds = this.db.serviceProviders.filter((sp) => sp.is_active);
    if (requiredSkillIds.length > 0) {
      qualifiedProviderIds = qualifiedProviderIds.filter(sp => {
        const pSkills = this.db.providerSkills
          .filter(ps => ps.sp_id === sp.sp_id && ps.verification_status.toLowerCase() === 'verified')
          .map(ps => ps.skill_id);
        return requiredSkillIds.every(sid => pSkills.includes(sid));
      });
    }

    if (qualifiedProviderIds.length === 0) {
      return { best: null, anyQualified: false, serviceName: service.service_name, durationMin };
    }

    const scheduledDate = scheduledAtStr.split('T')[0];
    const scheduledTime = scheduledAtStr.includes('T') ? scheduledAtStr.split('T')[1].substring(0, 5) : null;
    
    // If a time is provided (e.g. 14:30), compute the start/end
    const jobStartMin = scheduledTime ? this.toMinutes(scheduledTime) : null;
    const jobEndMin = jobStartMin !== null ? jobStartMin + durationMin : null;

    let availableProviders = qualifiedProviderIds.filter(sp => {
      // 1. Check Unavailability Table
      const unavailable = this.db.providerUnavailability.some(pu => {
        if (pu.sp_id !== sp.sp_id || pu.date !== scheduledDate) return false;
        if (!pu.hour_start || !pu.hour_end) return true; // Full day
        if (jobStartMin === null || jobEndMin === null) return true; 
        return this.overlaps(jobStartMin, jobEndMin, this.toMinutes(pu.hour_start), this.toMinutes(pu.hour_end));
      });
      if (unavailable) return false;

      // 2. Check Provider Working Hours
      if (jobStartMin !== null && jobEndMin !== null) {
        const pStart = this.toMinutes(sp.hour_start || '00:00');
        const pEnd = this.toMinutes(sp.hour_end || '23:59');
        if (jobStartMin < pStart || jobEndMin > pEnd) return false;
      }

      // 3. Check Overlapping DB Assignments
      const dbOverlap = this.db.jobAssignments.some(ja => {
        if (ja.sp_id !== sp.sp_id || ja.scheduled_date !== scheduledDate || ja.status === 'CANCELLED' || ja.status === 'COMPLETED') return false;
        if (jobStartMin === null || jobEndMin === null) return true;
        return this.overlaps(jobStartMin, jobEndMin, this.toMinutes(ja.hour_start), this.toMinutes(ja.hour_end));
      });
      if (dbOverlap) return false;

      // 4. Check Overlapping Pending Assignments
      const pendingOverlap = pendingAssignments.some(pa => {
        if (pa.sp_id !== sp.sp_id || pa.scheduled_date !== scheduledDate) return false;
        if (jobStartMin === null || jobEndMin === null) return true;
        return this.overlaps(jobStartMin, jobEndMin, this.toMinutes(pa.hour_start), this.toMinutes(pa.hour_end));
      });
      if (pendingOverlap) return false;

      return true;
    });

    if (availableProviders.length === 0) {
      return { best: null, anyQualified: true, serviceName: service.service_name, durationMin };
    }

    // Sort by rating
    availableProviders.sort((a, b) => b.rating - a.rating);

    return {
      best: { provider: availableProviders[0], score: availableProviders[0].rating },
      anyQualified: true,
      serviceName: service.service_name,
      durationMin,
      scheduledDate,
      scheduledTime
    };
  }

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
      const scheduledAtStr = bs.scheduled_at || this.db.now();
      const result = this.findBestProvider(bs.service_id, scheduledAtStr);
      const bestProvider = result.best?.provider;

      if (!bestProvider) {
        const timeMessage = result.anyQualified 
          ? " (Note: some providers are qualified but may be off-duty or fully booked at this time)"
          : "";
          
        throw new BadRequestException(
          `No qualified provider found for service "${result.serviceName}" at the scheduled time.${timeMessage}`,
        );
      }

      const hourStart = result.scheduledTime || bestProvider.hour_start || '09:00';
      const endMinutes = this.toMinutes(hourStart) + result.durationMin;
      const hourEnd = this.fromMinutes(endMinutes);

      // Create assignment
      const assignment = this.repo.create({
        service_id: bs.service_id,
        scheduled_date: result.scheduledDate || this.db.now().split('T')[0],
        hour_start: hourStart,
        hour_end: hourEnd,
        status: 'ASSIGNED',
        assignment_score: result.best?.score ?? null,
        notes: null,
        assigned_at: this.db.now(),
        booking_id: bookingId,
        sp_id: bestProvider.sp_id,
      });

      this.revenueLedgerService.createPendingFromAssignment(assignment);
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

  // ── Helpers ────────────────────────────────────────────

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


  // ── Status Updates ─────────────────────────────────────

  async markComplete(assignmentId: string, dto: any) {
    const assignment = this.repo.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException(`Assignment "${assignmentId}" not found`);
    }

    if (assignment.status === 'COMPLETED') {
      throw new BadRequestException('Assignment is already completed');
    }

    this.repo.update(assignmentId, {
      status: 'COMPLETED',
      notes: dto.completion_notes || assignment.notes,
      updated_at: this.db.now(),
    });
    
    assignment.status = 'COMPLETED';

    try {
      this.revenueLedgerService.dispatchForAssignment(assignment);
    } catch (err) {
      console.warn(`Revenue ledger dispatch notice: ${err.message}`);
    }

    const allForBooking = this.repo.findByBooking(assignment.booking_id);
    const allComplete = allForBooking.every(
      (ja) => ja.status === 'COMPLETED',
    );

    if (allComplete) {
      this.bookingsRepo.update(assignment.booking_id, { status: 'COMPLETED' });
    }

    return this.enrichAssignment(this.repo.findById(assignmentId));
  }

  markInProgress(assignmentId: string) {
    const assignment = this.repo.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException(`Assignment "${assignmentId}" not found`);
    }

    if (assignment.status === 'IN_PROGRESS') {
      throw new BadRequestException('Assignment is already in progress');
    }
    if (assignment.status === 'COMPLETED') {
      throw new BadRequestException('Cannot revert a completed assignment to in-progress');
    }

    this.repo.update(assignmentId, { 
      status: 'IN_PROGRESS',
      updated_at: this.db.now()
    });

    const booking = this.bookingsRepo.findById(assignment.booking_id);
    if (booking && booking.status === 'ASSIGNED') {
      this.bookingsRepo.update(assignment.booking_id, { status: 'IN_PROGRESS' });
    }

    return this.enrichAssignment(this.repo.findById(assignmentId));
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
      category_name: service ? this.db.categories.find(c => c.category_id === service.category_id)?.category_name : 'Service',
      customer_name: customer?.full_name || 'Customer',
      customer_phone: customer?.phone || null,
      service_address: booking?.service_address || null,
      scheduled_at: bookingService?.scheduled_at || ja.assigned_at,
      estimated_duration_min: service?.estimated_duration_min || 60,
    };
  }

  // ── Queries ────────────────────────────────────────────

  findAll() {
    return this.repo.findAll().map(ja => this.enrichAssignment(ja));
  }

  findOne(id: string) {
    const item = this.repo.findById(id);
    if (!item) throw new NotFoundException(`JobAssignment "${id}" not found`);
    return this.enrichAssignment(item);
  }

  findByBooking(bookingId: string) {
    return this.repo.findByBooking(bookingId).map(ja => this.enrichAssignment(ja));
  }

  findByProvider(spId: string) {
    return this.repo.findByProvider(spId).map(ja => this.enrichAssignment(ja));
  }

  create(dto: CreateJobAssignmentDto) {
    const booking = this.db.bookings.find((b) => b.booking_id === dto.booking_id);
    if (!booking) throw new NotFoundException(`Booking "${dto.booking_id}" not found`);

    const sp = this.db.serviceProviders.find((p) => p.sp_id === dto.sp_id);
    if (!sp) throw new NotFoundException(`Provider "${dto.sp_id}" not found`);

    const assignment = this.repo.create({
      service_id: dto.service_id,
      scheduled_date: dto.scheduled_date,
      hour_start: dto.hour_start,
      hour_end: dto.hour_end,
      status: 'ASSIGNED',
      assignment_score: null,
      notes: dto.notes || null,
      assigned_at: this.db.now(),
      booking_id: dto.booking_id,
      sp_id: dto.sp_id,
    });

    this.revenueLedgerService.createPendingFromAssignment(assignment);
    return assignment;
  }

  update(id: string, dto: UpdateJobAssignmentDto) {
    const updated = this.repo.update(id, dto);
    if (!updated) throw new NotFoundException(`JobAssignment "${id}" not found`);
    return updated;
  }

  updateStatus(id: string, status: string, score?: number) {
    const assignment = this.findOne(id);
    const updated = this.repo.update(id, {
      status,
      assignment_score: score !== undefined ? score : assignment.assignment_score,
      updated_at: this.db.now(),
    });

    if (status === 'COMPLETED') {
      try {
        this.revenueLedgerService.dispatchForAssignment(assignment);
      } catch (err) {
        console.warn(`Revenue ledger dispatch notice: ${err.message}`);
      }
    }

    return updated;
  }

  remove(id: string) {
    const deleted = this.repo.delete(id);
    if (!deleted) throw new NotFoundException(`JobAssignment "${id}" not found`);
    return { success: true };
  }
}
