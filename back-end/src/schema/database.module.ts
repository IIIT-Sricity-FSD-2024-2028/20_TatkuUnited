import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './user.schema';
import { Provider, ProviderSchema } from './provider.schema';
import { Manager, ManagerSchema } from './manager.schema';
import { Region, RegionSchema } from './region.schema';
import { Category, CategorySchema } from './category.schema';
import { Service, ServiceSchema } from './service.schema';
import { Order, OrderSchema } from './order.schema';
import { Booking, BookingSchema } from './booking.schema';
import { Payment, PaymentSchema } from './payment.schema';
import { Review, ReviewSchema } from './review.schema';
import { Unavailability, UnavailabilitySchema } from './unavailability.schema';
import {
  PlatformSetting,
  PlatformSettingSchema,
} from './platform-setting.schema';

const models = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
  { name: Provider.name, schema: ProviderSchema },
  { name: Manager.name, schema: ManagerSchema },
  { name: Region.name, schema: RegionSchema },
  { name: Category.name, schema: CategorySchema },
  { name: Service.name, schema: ServiceSchema },
  { name: Order.name, schema: OrderSchema },
  { name: Booking.name, schema: BookingSchema },
  { name: Payment.name, schema: PaymentSchema },
  { name: Review.name, schema: ReviewSchema },
  { name: Unavailability.name, schema: UnavailabilitySchema },
  { name: PlatformSetting.name, schema: PlatformSettingSchema },
]);

/**
 * DatabaseModule � registers every Mongoose model globally so any feature
 * module can inject its Model<T> without re-importing MongooseModule.forFeature.
 */
@Module({
  imports: [models],
  exports: [models],
})
export class DatabaseModule {}
