import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DatabaseService,
  JobAssignment,
} from '../../common/database/database.service';

@Injectable()
export class JobAssignmentsRepository {
  constructor(private readonly db: DatabaseService) {}

  findAll(): JobAssignment[] {
    return this.db.jobAssignments;
  }

  findById(assignmentId: string): JobAssignment | undefined {
    return this.db.jobAssignments.find(
      (ja) => ja.assignment_id === assignmentId,
    );
  }

  findByBooking(bookingId: string): JobAssignment[] {
    return this.db.jobAssignments.filter(
      (ja) => ja.booking_id === bookingId,
    );
  }

  findByProvider(spId: string): JobAssignment[] {
    return this.db.jobAssignments.filter(
      (ja) => ja.sp_id === spId,
    );
  }

  create(
    data: Omit<JobAssignment, 'assignment_id' | 'created_at' | 'updated_at'>,
  ): JobAssignment {
    const assignment: JobAssignment = {
      ...data,
      assignment_id: this.db.genId(),
      created_at: this.db.now(),
      updated_at: this.db.now(),
    };
    this.db.jobAssignments.push(assignment);
    this.db.save();
    return assignment;
  }

  update(
    assignmentId: string,
    data: Partial<JobAssignment>,
  ): JobAssignment | undefined {
    const idx = this.db.jobAssignments.findIndex(
      (ja) => ja.assignment_id === assignmentId,
    );
    if (idx === -1) return undefined;
    this.db.jobAssignments[idx] = {
      ...this.db.jobAssignments[idx],
      ...data,
      updated_at: this.db.now(),
    };
    this.db.save();
    return this.db.jobAssignments[idx];
  }
}
