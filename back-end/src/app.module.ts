import { Module, ValidationPipe, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SuperUsersModule } from './modules/super-users/super-users.module';
import { ServiceProvidersModule } from './modules/service-providers/service-providers.module';
import { CustomersModule } from './modules/customers/customers.module';
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
import { AuthModule } from './modules/auth/auth.module';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggerModule } from './common/logger/logger.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { RequestTraceMiddleware } from './common/middleware/request-trace.middleware';

@Module({
  imports: [
    LoggerModule,
    CloudinaryModule,
    SuperUsersModule,
    ServiceProvidersModule,
    CustomersModule,
    CategoriesModule,
    ServicesModule,
    SkillsModule,
    ProviderSkillsModule,
    ProviderUnavailabilityModule,
    BookingsModule,
    JobAssignmentsModule,
    TransactionsModule,
    RevenueLedgerModule,
    ReviewsModule,
    PlatformSettingsModule,
    DatabaseModule,
    CartModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply LoggerMiddleware to ALL routes
    consumer.apply(LoggerMiddleware).forRoutes('*');

    // Scoped / router-level middleware for specific routes
    consumer
      .apply(RequestTraceMiddleware)
      .forRoutes('service-providers', 'bookings');
  }
}
