import { Module, forwardRef } from '@nestjs/common';
import { JobAssignmentsService } from './job-assignments.service';
import { JobAssignmentsController } from './job-assignments.controller';
import { JobAssignmentsRepository } from './job-assignments.repository';
import { BookingsModule } from '../bookings/bookings.module';
import { DatabaseModule } from '../../common/database/database.module';
import { RevenueLedgerModule } from '../revenue-ledger/revenue-ledger.module';

@Module({
  imports: [
    forwardRef(() => BookingsModule),
    DatabaseModule,
    RevenueLedgerModule,
  ],
  controllers: [JobAssignmentsController],
  providers: [JobAssignmentsService, JobAssignmentsRepository],
  exports: [JobAssignmentsService],
})
export class JobAssignmentsModule {}
