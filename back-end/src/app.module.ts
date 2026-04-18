import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SuperUsersModule } from './modules/super-users/super-users.module';
import { CollectiveManagersModule } from './modules/collective-managers/collective-managers.module';
import { UnitManagersModule } from './modules/unit-managers/unit-managers.module';
import { ServiceProvidersModule } from './modules/service-providers/service-providers.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CollectivesModule } from './modules/collectives/collectives.module';
import { SectorsModule } from './modules/sectors/sectors.module';
import { UnitsModule } from './modules/units/units.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ServicesModule } from './modules/services/services.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ProviderSkillsModule } from './modules/provider-skills/provider-skills.module';
import { ProviderUnavailabilityModule } from './modules/provider-unavailability/provider-unavailability.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { JobAssignmentsModule } from './modules/job-assignments/job-assignments.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { RevenueLedgerModule } from './modules/revenue-ledger/revenue-ledger.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PlatformSettingsModule } from './modules/platform-settings/platform-settings.module';
import { DatabaseModule } from './common/database/database.module';
import { CartModule } from './modules/cart/cart.module';

@Module({
  imports: [SuperUsersModule, CollectiveManagersModule, UnitManagersModule, ServiceProvidersModule, CustomersModule, CollectivesModule, SectorsModule, UnitsModule, CategoriesModule, ServicesModule, SkillsModule, ProviderSkillsModule, ProviderUnavailabilityModule, BookingsModule, JobAssignmentsModule, TransactionsModule, RevenueLedgerModule, ReviewsModule, PlatformSettingsModule, DatabaseModule, CartModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
