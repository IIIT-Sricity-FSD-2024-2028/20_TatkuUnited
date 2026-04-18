import { PartialType } from '@nestjs/swagger';
import { CreateJobAssignmentDto } from './create-job-assignment.dto';

export class UpdateJobAssignmentDto extends PartialType(CreateJobAssignmentDto) {}
