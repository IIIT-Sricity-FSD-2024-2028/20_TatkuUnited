import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../schema/order.schema';
import { Booking, BookingDocument } from '../schema/booking.schema';
import { Payment, PaymentDocument } from '../schema/payment.schema';
import { Service, ServiceDocument } from '../schema/service.schema';
import { Provider, ProviderDocument } from '../schema/provider.schema';
import { User, UserDocument } from '../schema/user.schema';
import { Region, RegionDocument } from '../schema/region.schema';
import {
  PlatformSetting,
  PlatformSettingDocument,
} from '../schema/platform-setting.schema';
import {
  Unavailability,
  UnavailabilityDocument,
} from '../schema/unavailability.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { BookingStatus, PaymentStatus, PayoutStatus } from '../common/enums';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Region.name)
    private readonly regionModel: Model<RegionDocument>,
    @InjectModel(PlatformSetting.name)
    private readonly platformSettingModel: Model<PlatformSettingDocument>,
    @InjectModel(Unavailability.name)
    private readonly unavailabilityModel: Model<UnavailabilityDocument>,
  ) {}

  create(dto: CreateOrderDto) {
    return new this.orderModel(dto).save();
  }

  findAll() {
    return this.orderModel.find().exec();
  }

  findByCustomer(customerId: string) {
    const customer = Types.ObjectId.isValid(customerId)
      ? new Types.ObjectId(customerId)
      : customerId;
    return this.orderModel
      .find({ customer })
      .sort({ createdAt: -1 })
      .exec();
  }

  findByStatus(status: PaymentStatus | string) {
    return this.orderModel
      .find({ paymentStatus: status as PaymentStatus })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findWithDetails(id: string) {
    const doc = await this.orderModel
      .findById(id)
      .populate('customer', '-password')
      .populate('payment')
      .exec();
    if (!doc) throw new NotFoundException(`Order ${id} not found`);

    const bookings = await this.bookingModel
      .find({ order: doc._id })
      .populate('service region')
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .exec();


    return {
      ...doc.toObject(),
      bookings,
    };
  }

  async findOne(id: string) {
    const doc = await this.orderModel.findById(id).exec();
    if (!doc) throw new NotFoundException(`Order ${id} not found`);
    return doc;
  }

  async update(id: string, dto: UpdateOrderDto) {
    const doc = await this.orderModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException(`Order ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.orderModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Order ${id} not found`);
    return doc;
  }

  /**
   * Section 2: Checkout endpoint running in one Mongoose transaction.
   * Validates cart, active services, non-overlapping items, provider availability,
   * creates Order, Bookings (status: awaiting_provider), and Mock Payment.
   */
  async checkout(customerId: string) {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();

    try {
      const user = await this.userModel
        .findById(customerId)
        .session(session)
        .exec();
      if (!user) {
        throw new NotFoundException(`Customer ${customerId} not found`);
      }

      if (!user.cart?.items || user.cart.items.length === 0) {
        throw new BadRequestException('Shopping cart is empty');
      }

      // 1. Verify address
      const chosenAddress = (user.addresses || []).find(
        (a: any) =>
          a.id === user.cart.address || a._id?.toString() === user.cart.address,
      );
      if (!chosenAddress || !chosenAddress.location?.coordinates) {
        throw new BadRequestException(
          'Delivery address not selected or missing coordinates',
        );
      }
      const coords = chosenAddress.location.coordinates as [number, number];

      // 2. Fetch platform settings
      const settings = await this.platformSettingModel
        .findOne()
        .session(session)
        .exec();
      const safeSettings = settings || ({
        platformFeePercent: 15,
        maxAssignmentDistanceKm: 10,
        slotIntervalMinutes: 30,
        firstSlotStart: 480,
        lastSlotStart: 1170,
        bookingWindowDays: 3,
        minLeadMinutes: 120,
        travelBufferMinutes: 30,
      } as any);

      const feePercent = safeSettings.platformFeePercent ?? 15;
      const travelBuffer = safeSettings.travelBufferMinutes ?? 30;

      // 3. Find nearest active region to address
      let regionDoc = await this.regionModel
        .findOne({
          isActive: true,
          location: {
            $nearSphere: {
              $geometry: { type: 'Point', coordinates: coords },
            },
          },
        })
        .session(session)
        .exec();

      if (!regionDoc) {
        regionDoc = await this.regionModel
          .findOne({ isActive: true })
          .session(session)
          .exec();
      }

      // 4. Validate no two cart items overlap
      const cartItems = user.cart.items;
      for (let i = 0; i < cartItems.length; i++) {
        for (let j = i + 1; j < cartItems.length; j++) {
          const d1 = new Date(cartItems[i].scheduledDate)
            .toISOString()
            .slice(0, 10);
          const d2 = new Date(cartItems[j].scheduledDate)
            .toISOString()
            .slice(0, 10);
          if (d1 === d2) {
            if (
              cartItems[i].startTime < cartItems[j].endTime &&
              cartItems[i].endTime > cartItems[j].startTime
            ) {
              throw new BadRequestException(
                'Two cart items have overlapping time slots',
              );
            }
          }
        }
      }

      // 5. Validate each item has an eligible provider, service is active, and date in future
      const now = new Date();
      const targetBookings: any[] = [];
      let totalAmount = 0;

      for (const item of cartItems) {
        const service = await this.serviceModel
          .findById(item.service)
          .session(session)
          .exec();
        if (!service || !service.isActive) {
          throw new BadRequestException(
            `Service is inactive or no longer available`,
          );
        }

        const scheduledDate = new Date(item.scheduledDate);
        if (scheduledDate < new Date(now.toISOString().slice(0, 10))) {
          throw new BadRequestException('Scheduled date cannot be in the past');
        }

        const dateStr = scheduledDate.toISOString().slice(0, 10);

        // Prevent duplicate unpaid orders for the same customer and slot (§5)
        const duplicateUnpaidBooking = await this.bookingModel
          .findOne({
            customer: user._id,
            scheduledDate: scheduledDate,
            startTime: item.startTime,
            endTime: item.endTime,
            status: BookingStatus.AWAITING_PROVIDER,
          })
          .session(session)
          .exec();

        if (duplicateUnpaidBooking && duplicateUnpaidBooking.order) {
          const duplicateOrder = await this.orderModel
            .findOne({
              _id: duplicateUnpaidBooking.order,
              paymentStatus: PaymentStatus.CREATED,
              expiresAt: { $gt: now },
            })
            .session(session)
            .exec();

          if (duplicateOrder) {
            throw new BadRequestException(
              `An active unpaid order already exists for this slot on ${dateStr}. Please complete payment on order ${duplicateOrder._id} or wait for it to expire.`,
            );
          }
        }
        const [y, m, d] = dateStr.split('-').map(Number);
        const targetWeekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

        // Check provider eligibility for this slot
        const maxDistanceMetres =
          (safeSettings.maxAssignmentDistanceKm || 10) * 1000;
        const candidates = await this.providerModel.aggregate([
          {
            $geoNear: {
              near: { type: 'Point', coordinates: coords },
              distanceField: 'dist',
              maxDistance: maxDistanceMetres,
              spherical: true,
              query: {
                status: 'approved',
                offeredServices: service._id,
                workingDays: targetWeekday,
              },
            },
          },
        ]);

        if (!candidates || candidates.length === 0) {
          throw new BadRequestException(
            `No available provider found for ${service.name} on ${dateStr}`,
          );
        }

        const candidateIds = candidates.map((c) => c._id);
        const activeBookings = await this.bookingModel
          .find({
            provider: { $in: candidateIds },
            scheduledDate: scheduledDate,
            status: {
              $in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
            },
          })
          .session(session)
          .exec();

        const unavailabilities = await this.unavailabilityModel
          .find({
            provider: { $in: candidateIds },
            date: scheduledDate,
          })
          .session(session)
          .exec();

        const blockStartTime = item.startTime - travelBuffer;
        const hasEligible = candidates.some((candidate) => {
          if (
            candidate.workHourStart > item.startTime ||
            item.endTime > candidate.workHourEnd
          ) {
            return false;
          }
          const bookingConflict = activeBookings.some((b) => {
            if (b.provider?.toString() !== candidate._id?.toString())
              return false;
            const bBlock = b.blockStartTime ?? (b.startTime - travelBuffer);
            return bBlock < item.endTime && b.endTime > blockStartTime;
          });
          if (bookingConflict) return false;

          const unavailConflict = unavailabilities.some((u) => {
            if (u.provider?.toString() !== candidate._id?.toString())
              return false;
            return u.startTime < item.endTime && u.endTime > blockStartTime;
          });
          if (unavailConflict) return false;

          return true;
        });

        if (!hasEligible) {
          throw new BadRequestException(
            `No available provider for slot on ${dateStr} from ${item.startTime} to ${item.endTime}`,
          );
        }

        const price = service.price; // in paise
        const platformShare = Math.round((price * feePercent) / 100);
        const providerShare = price - platformShare;
        totalAmount += price;

        targetBookings.push({
          service: service._id,
          provider: null, // First-accept assignment: nullable until accepted!
          customer: user._id,
          region: regionDoc ? regionDoc._id : null,
          scheduledDate: scheduledDate,
          startTime: item.startTime,
          endTime: item.endTime,
          blockStartTime: blockStartTime,
          price: price,
          platformFeePercent: feePercent,
          platformShare: platformShare,
          providerShare: providerShare,
          status: BookingStatus.AWAITING_PROVIDER,
          payoutStatus: PayoutStatus.PENDING,
          declinedBy: [],
          offers: [],
          offerRound: 0,
        });
      }

      // 6. Create the Order
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // now + 15 min
      const orderDocs = await this.orderModel.create(
        [
          {
            customer: user._id,
            address: {
              line: chosenAddress.line,
              city: chosenAddress.city,
              location: chosenAddress.location,
            },
            totalAmount: totalAmount,
            paymentStatus: PaymentStatus.CREATED,
            expiresAt: expiresAt,
          },
        ],
        { session },
      );
      const order = orderDocs[0];

      // 7. Create Bookings with order reference
      for (const b of targetBookings) {
        b.order = order._id;
      }
      await this.bookingModel.insertMany(targetBookings, { session });

      // 8. Create Mock Payment
      const razorpayOrderId = `mock_order_${order._id.toString()}`;
      const paymentDocs = await this.paymentModel.create(
        [
          {
            order: order._id,
            totalAmount: totalAmount,
            currency: 'INR',
            razorpayOrderId: razorpayOrderId,
            refunds: [],
          },
        ],
        { session },
      );
      const payment = paymentDocs[0];

      order.payment = payment._id;
      await order.save({ session });

      await session.commitTransaction();

      return {
        orderId: order._id.toString(),
        amount: totalAmount,
        currency: 'INR',
        razorpayOrderId: razorpayOrderId,
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
}

