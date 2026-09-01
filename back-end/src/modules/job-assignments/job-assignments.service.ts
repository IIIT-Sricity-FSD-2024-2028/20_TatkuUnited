import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobAssignmentsRepository } from './job-assignments.repository';
import { CreateJobAssignmentDto } from './dto/create-job-assignment.dto';
import { UpdateJobAssignmentDto } from './dto/update-job-assignment.dto';
import { DatabaseService, JobAssignment } from '../../common/database/database.service';
import { RevenueLedgerService } from '../revenue-ledger/revenue-ledger.service';
import { AccessScopeService } from '../../common/access/access-scope.service';

@Injectable()
export class JobAssignmentsService {
  constructor(
    private readonly repo: JobAssignmentsRepository,
    private readonly db: DatabaseService,
    private readonly revenueLedgerService: RevenueLedgerService,
    private readonly accessScope: AccessScopeService,
  ) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: string) {
    const item = this.repo.findById(id);
    if (!item) throw new NotFoundException(`JobAssignment "${id}" not found`);
    return item;
  }

  findByBooking(bookingId: string) {
    return this.repo.findByBooking(bookingId);
  }

  findByProvider(spId: string) {
    return this.repo.findByProvider(spId);
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
