import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from './schema/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Common modules & security
import { LoggerModule } from './common/logger/logger.module';
import { AuthModule } from './auth/auth.module';
import {
  CorrelationIdMiddleware,
  SanitizeInputMiddleware,
  HttpLoggingMiddleware,
} from './common/middlewares';

// Domain modules
import { UsersModule } from './users/users.module';
import { ProvidersModule } from './providers/providers.module';
import { ManagersModule } from './managers/managers.module';
import { RegionsModule } from './regions/regions.module';
import { CategoriesModule } from './categories/categories.module';
import { ServicesModule } from './services/services.module';
import { OrdersModule } from './orders/orders.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UnavailabilityModule } from './unavailability/unavailability.module';
import { PlatformSettingsModule } from './platform-settings/platform-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL') ?? 60000, // 60 seconds
          limit: config.get<number>('THROTTLE_LIMIT') ?? 100, // 100 requests per TTL window
        },
      ],
    }),
    LoggerModule,
    AuthModule,
    DatabaseModule,
    UsersModule,
    ProvidersModule,
    ManagersModule,
    RegionsModule,
    CategoriesModule,
    ServicesModule,
    OrdersModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    UnavailabilityModule,
    PlatformSettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        CorrelationIdMiddleware,
        SanitizeInputMiddleware,
        HttpLoggingMiddleware,
      )
      .forRoutes('*');
  }
}
