import { Module, forwardRef } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { CartModule } from '../cart/cart.module';
import { DatabaseModule } from '../../common/database/database.module';
import { JobAssignmentsModule } from '../job-assignments/job-assignments.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';

@Module({
  imports: [
    CartModule,
    DatabaseModule,
    forwardRef(() => JobAssignmentsModule),
    TransactionsModule,
    PlatformSettingsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsRepository],
  exports: [BookingsService, BookingsRepository],
})
export class BookingsModule {}
