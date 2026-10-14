import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../schema/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { MatchingService } from './matching.service';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
    forwardRef(() => PaymentsModule),
  ],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
