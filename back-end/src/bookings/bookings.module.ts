import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../schema/database.module';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProvidersModule } from '../providers/providers.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
    ProvidersModule,
    forwardRef(() => MatchingModule),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}

