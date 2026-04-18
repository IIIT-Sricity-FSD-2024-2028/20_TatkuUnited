import { Module } from '@nestjs/common';
import { JobAssignmentsService } from './job-assignments.service';
import { JobAssignmentsController } from './job-assignments.controller';

@Module({
  controllers: [JobAssignmentsController],
  providers: [JobAssignmentsService],
})
export class JobAssignmentsModule {}
