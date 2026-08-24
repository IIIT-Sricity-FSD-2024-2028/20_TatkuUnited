import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { Provider, ProviderSchema } from './provider.schema';
import { Category, CategorySchema } from './category.schema';
import { Service, ServiceSchema } from './service.schema';
import { Cart, CartSchema } from './cart.schema';
import { Unavailability, UnavailabilitySchema } from './unavailability.schema';
import { Booking, BookingSchema } from './booking.schema';
import { Payment, PaymentSchema } from './payment.schema';
import { Review, ReviewSchema } from './review.schema';
import {
  PlatformSettings,
  PlatformSettingsSchema,
} from './platform-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Provider.name, schema: ProviderSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Unavailability.name, schema: UnavailabilitySchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: PlatformSettings.name, schema: PlatformSettingsSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
