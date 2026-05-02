import { Module } from '@nestjs/common';
import { JobAssignmentsService } from './job-assignments.service';
import { JobAssignmentsController } from './job-assignments.controller';
import { JobAssignmentsRepository } from './job-assignments.repository';
import { BookingsModule } from '../bookings/bookings.module';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [BookingsModule, DatabaseModule],
  controllers: [JobAssignmentsController],
  providers: [JobAssignmentsService, JobAssignmentsRepository],
  exports: [JobAssignmentsService],
})
export class JobAssignmentsModule {}
