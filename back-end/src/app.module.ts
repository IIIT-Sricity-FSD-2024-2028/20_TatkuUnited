import { Module } from "@nestjs/common"
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from './schema/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
  providers: [AppService],
})
export class AppModule {}
