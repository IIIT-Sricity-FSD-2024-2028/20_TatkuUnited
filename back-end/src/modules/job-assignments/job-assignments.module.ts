import { Module } from '@nestjs/common';
import { JobAssignmentsService } from './job-assignments.service';
import { JobAssignmentsController } from './job-assignments.controller';
import { RevenueLedgerModule } from '../revenue-ledger/revenue-ledger.module';

@Module({
  imports: [RevenueLedgerModule],
  controllers: [JobAssignmentsController],
  providers: [JobAssignmentsService],
})
export class JobAssignmentsModule {}
