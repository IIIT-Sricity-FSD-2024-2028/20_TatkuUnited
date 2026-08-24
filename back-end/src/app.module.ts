import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from './schema/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BookingsModule } from './bookings/bookings.module';
import { CartModule } from './cart/cart.module';
import { CategoryModule } from './payment/category/category.module';
import { CategoryModule } from './category/category.module';
import { PaymentModule } from './payment/payment.module';
import { PlatformSettingsModule } from './platform-settings/platform-settings.module';
import { CartsModule } from './carts/carts.module';
import { CategoriesModule } from './categories/categories.module';
import { PaymentsModule } from './payments/payments.module';
import { ProvidersModule } from './providers/providers.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ServicesModule } from './services/services.module';
import { UnavailabilityModule } from './unavailability/unavailability.module';
import { UsersModule } from './users/users.module';

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
    BookingsModule,
    CartModule,
    CategoryModule,
    PaymentModule,
    PlatformSettingsModule,
    CartsModule,
    CategoriesModule,
    PaymentsModule,
    ProvidersModule,
    ReviewsModule,
    ServicesModule,
    UnavailabilityModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
