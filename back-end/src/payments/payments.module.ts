import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../schema/database.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => MatchingModule)],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

