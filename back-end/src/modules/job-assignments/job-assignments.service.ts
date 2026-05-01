import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobAssignmentDto } from './dto/create-job-assignment.dto';
import { UpdateJobAssignmentDto } from './dto/update-job-assignment.dto';
import { DatabaseService } from '../../common/database/database.service';
import { RevenueLedgerService } from '../revenue-ledger/revenue-ledger.service';

@Injectable()
export class JobAssignmentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly revenueLedger: RevenueLedgerService,
  ) {}

  create(createJobAssignmentDto: CreateJobAssignmentDto) {
    return 'This action adds a new jobAssignment';
  }

  findAll() {
    return `This action returns all jobAssignments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} jobAssignment`;
  }

  update(id: number, updateJobAssignmentDto: UpdateJobAssignmentDto) {
    return `This action updates a #${id} jobAssignment`;
  }

  remove(id: number) {
    return `This action removes a #${id} jobAssignment`;
  }

  async completeJob(assignmentId: string) {
    const assignment = this.db.jobAssignments.find(a => a.assignment_id === assignmentId);
    if (!assignment) throw new NotFoundException('Job assignment not found');
    
    assignment.status = 'COMPLETED';
    assignment.updated_at = this.db.now();
  
    // Trigger ledger creation
    await this.revenueLedger.createFromJobCompletion(assignment);
  
    return assignment;
  }
}
