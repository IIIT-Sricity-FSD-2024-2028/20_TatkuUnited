import { Injectable } from '@nestjs/common';
import { CreateJobAssignmentDto } from './dto/create-job-assignment.dto';
import { UpdateJobAssignmentDto } from './dto/update-job-assignment.dto';

@Injectable()
export class JobAssignmentsService {
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
}
