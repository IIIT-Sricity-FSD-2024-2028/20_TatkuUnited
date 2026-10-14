import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from '../schema/payment.schema';
import { Order, OrderDocument } from '../schema/order.schema';
import { Booking, BookingDocument } from '../schema/booking.schema';
import { User, UserDocument } from '../schema/user.schema';
import {
  Notification,
  NotificationDocument,
} from '../schema/notification.schema';
import {
  BookingStatus,
  CancelledBy,
  PaymentStatus,
  RefundStatus,
  Role,
} from '../common/enums';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class PaymentsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentsService.name);
  private expiryInterval: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @Inject(forwardRef(() => MatchingService))
    private readonly matchingService: MatchingService,
  ) {}


  onModuleInit() {
    // Start background order expiry sweep job every 60 seconds
    this.expiryInterval = setInterval(() => {
      this.sweepExpiredOrders().catch((err) =>
        this.logger.error('Error sweeping expired orders:', err),
      );
    }, 60000);
    this.logger.log('Payment order expiry sweep job scheduled (every 60s)');
  }

  onModuleDestroy() {
    if (this.expiryInterval) {
      clearInterval(this.expiryInterval);
      this.expiryInterval = null;
    }
  }

  create(dto: CreatePaymentDto) {
    return new this.paymentModel(dto).save();
  }

  findAll() {
    return this.paymentModel.find().exec();
  }

  async findOne(id: string) {
    const doc = await this.paymentModel.findById(id).exec();
    if (!doc) throw new NotFoundException(`Payment ${id} not found`);
    return doc;
  }

  findByOrder(orderId: string) {
    const order = Types.ObjectId.isValid(orderId)
      ? new Types.ObjectId(orderId)
      : orderId;
    return this.paymentModel.findOne({ order }).exec();
  }

  /** Used by Razorpay webhook or lookup to find the payment. */
  findByRazorpayOrderId(razorpayOrderId: string) {
    return this.paymentModel.findOne({ razorpayOrderId }).exec();
  }

  async update(id: string, dto: UpdatePaymentDto) {
    const doc = await this.paymentModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException(`Payment ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.paymentModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Payment ${id} not found`);
    return doc;
  }

  /**
   * Section 3: Mock Payment Simulation (Atomic Claim / Success / Failure / Idempotency / Expiry)
   */
  async simulate(
    orderId: string,
    success: boolean,
    currentUser?: AuthenticatedUser,
  ) {
    const orderDoc = await this.orderModel.findById(orderId).exec();
    if (!orderDoc) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Ownership check (Item 4)
    if (currentUser && currentUser.role !== Role.ADMIN) {
      if (orderDoc.customer.toString() !== currentUser.userId) {
        throw new ForbiddenException(
          'Access denied. You do not have permission to pay for this order',
        );
      }
    }

    // 1. Idempotency check: if order is already paid, return immediately without changes
    if (orderDoc.paymentStatus === PaymentStatus.PAID) {
      const payment = await this.paymentModel
        .findOne({ order: orderDoc._id })
        .exec();
      return {
        success: true,
        orderId: orderDoc._id.toString(),
        paymentStatus: PaymentStatus.PAID,
        paymentId: payment?.razorpayPaymentId,
        message: 'Order already paid',
      };
    }

    // 2. Order already marked failed or refunded (e.g. swept by expiry job) (Item 2)
    if (
      orderDoc.paymentStatus === PaymentStatus.FAILED ||
      orderDoc.paymentStatus === PaymentStatus.REFUNDED
    ) {
      if (success) {
        await this.recordFullRefundForOrder(orderDoc._id);
        orderDoc.paymentStatus = PaymentStatus.REFUNDED;
        await orderDoc.save();
        return {
          success: false,
          orderId: orderDoc._id.toString(),
          paymentStatus: PaymentStatus.REFUNDED,
          message:
            'Order has already failed or expired. Payment refused and refund recorded.',
        };
      }
      return {
        success: false,
        orderId: orderDoc._id.toString(),
        paymentStatus: orderDoc.paymentStatus,
        message: `Order was already marked ${orderDoc.paymentStatus}.`,
      };
    }

    // 3. Expired but unswept order (expiresAt < now) (Item 2)
    if (
      orderDoc.expiresAt &&
      new Date(orderDoc.expiresAt).getTime() < Date.now()
    ) {
      await this.bookingModel
        .updateMany(
          { order: orderDoc._id },
          {
            status: BookingStatus.CANCELLED,
            cancelledBy: CancelledBy.SYSTEM,
            cancelledReason: 'order expired',
          },
        )
        .exec();

      if (success) {
        await this.recordFullRefundForOrder(orderDoc._id);
      }
      orderDoc.paymentStatus = success
        ? PaymentStatus.REFUNDED
        : PaymentStatus.FAILED;
      await orderDoc.save();

      return {
        success: false,
        orderId: orderDoc._id.toString(),
        paymentStatus: orderDoc.paymentStatus,
        message:
          'Order expired before payment. Payment not confirmed and refund recorded.',
      };
    }

    // 4. Failure flow: mark failed, cancel bookings, leave customer cart intact for retry
    if (!success) {
      const session = await this.paymentModel.db.startSession();
      session.startTransaction();
      try {
        const claimedOrder = await this.orderModel.findOneAndUpdate(
          {
            _id: orderDoc._id,
            paymentStatus: PaymentStatus.CREATED,
          },
          {
            $set: { paymentStatus: PaymentStatus.FAILED },
          },
          { session, new: true },
        );

        if (!claimedOrder) {
          await session.abortTransaction();
          return {
            success: false,
            orderId: orderDoc._id.toString(),
            paymentStatus: orderDoc.paymentStatus,
            message: 'Order state already modified by concurrent operation.',
          };
        }

        await this.bookingModel
          .updateMany(
            { order: orderDoc._id },
            {
              status: BookingStatus.CANCELLED,
              cancelledBy: CancelledBy.SYSTEM,
              cancelledReason: 'payment failed',
            },
            { session },
          )
          .exec();

        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }

      return {
        success: false,
        orderId: orderDoc._id.toString(),
        paymentStatus: PaymentStatus.FAILED,
        message: 'Payment failed. You may retry your checkout from the cart.',
      };
    }

    // 5. Success flow (Item 1: Atomic Claim inside transaction)
    const session = await this.paymentModel.db.startSession();
    session.startTransaction();
    let paymentDoc: PaymentDocument | null = null;
    try {
      const claimedOrder = await this.orderModel.findOneAndUpdate(
        {
          _id: orderDoc._id,
          paymentStatus: PaymentStatus.CREATED,
        },
        {
          $set: { paymentStatus: PaymentStatus.PAID },
        },
        { session, new: true },
      );

      if (!claimedOrder) {
        // Concurrent race condition lost!
        await session.abortTransaction();
        const current = await this.orderModel.findById(orderDoc._id).exec();
        if (current?.paymentStatus === PaymentStatus.PAID) {
          const payment = await this.paymentModel
            .findOne({ order: orderDoc._id })
            .exec();
          return {
            success: true,
            orderId: orderDoc._id.toString(),
            paymentStatus: PaymentStatus.PAID,
            paymentId: payment?.razorpayPaymentId,
            message: 'Order already paid',
          };
        }
        return {
          success: false,
          orderId: orderDoc._id.toString(),
          paymentStatus: current?.paymentStatus,
          message: `Order processed concurrently (status: ${current?.paymentStatus})`,
        };
      }

      const payment = await this.paymentModel
        .findOne({ order: orderDoc._id })
        .session(session)
        .exec();
      if (!payment) {
        throw new NotFoundException(
          `Payment record for order ${orderId} not found`,
        );
      }

      payment.razorpayPaymentId = `mock_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      payment.razorpaySignature = `mock_sig_${Math.random().toString(36).substring(2, 9)}`;
      await payment.save({ session });
      paymentDoc = payment;

      // Clear customer cart
      await this.userModel.findByIdAndUpdate(
        orderDoc.customer,
        {
          $set: {
            'cart.items': [],
            'cart.address': null,
          },
        },
        { session },
      );

      await session.commitTransaction();
    } catch (err: any) {
      await session.abortTransaction();
      if (
        err?.message?.includes('Write conflict') ||
        err?.code === 112 ||
        err?.errorLabels?.includes('TransientTransactionError')
      ) {
        const current = await this.orderModel.findById(orderDoc._id).exec();
        if (current?.paymentStatus === PaymentStatus.PAID) {
          const payment = await this.paymentModel
            .findOne({ order: orderDoc._id })
            .exec();
          return {
            success: true,
            orderId: orderDoc._id.toString(),
            paymentStatus: PaymentStatus.PAID,
            paymentId: payment?.razorpayPaymentId,
            message: 'Order already paid',
          };
        }
      }
      throw err;
    } finally {
      session.endSession();
    }

    // ONLY the winning transaction reaches post-commit side effects:
    // a. Create ONE customer notification
    await new this.notificationModel({
      user: orderDoc.customer,
      type: 'payment_success',
      message: 'Payment received, finding a provider',
      readAt: null,
    }).save();

    // b. Trigger matching for each booking (Section 4)
    const bookings = await this.bookingModel
      .find({ order: orderDoc._id })
      .exec();
    for (const b of bookings) {
      await this.matchingService.offerBooking(b._id.toString());
    }


    return {
      success: true,
      orderId: orderDoc._id.toString(),
      paymentStatus: PaymentStatus.PAID,
      paymentId: paymentDoc?.razorpayPaymentId,
      message: 'Payment received, finding a provider',
    };
  }

  private async recordFullRefundForOrder(orderId: Types.ObjectId | string) {
    const payment = await this.paymentModel.findOne({ order: orderId }).exec();
    if (!payment) return;
    const bookings = await this.bookingModel.find({ order: orderId }).exec();
    for (const b of bookings) {
      const alreadyRefunded = payment.refunds.some(
        (r) => r.booking?.toString() === b._id.toString(),
      );
      if (!alreadyRefunded) {
        payment.refunds.push({
          booking: b._id as any,
          amount: b.price,
          razorpayRefundId: `mock_rfnd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          status: RefundStatus.PROCESSED,
          createdAt: new Date(),
        } as any);
      }
    }
    await payment.save();
  }

  /**
   * Refund method following booking_workflow.md section 8 and section 3
   */
  async refund(bookingId: string, amount: number, reason?: string) {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }
    if (!booking.order) {
      throw new BadRequestException(
        `Booking ${bookingId} has no associated order`,
      );
    }

    const order = await this.orderModel.findById(booking.order).exec();
    if (!order) {
      throw new NotFoundException(`Order ${booking.order} not found`);
    }

    const payment = await this.paymentModel
      .findOne({ order: order._id })
      .exec();
    if (!payment) {
      throw new NotFoundException(`Payment for order ${order._id} not found`);
    }

    if (amount > booking.price) {
      throw new BadRequestException(
        `Refund amount ${amount} cannot exceed booking price ${booking.price}`,
      );
    }

    const currentRefunded = payment.refunds.reduce(
      (sum, r) => sum + r.amount,
      0,
    );
    if (currentRefunded + amount > payment.totalAmount) {
      throw new BadRequestException(
        `Total refunds cannot exceed payment total amount (${payment.totalAmount})`,
      );
    }

    const refundEntry = {
      booking: booking._id as Types.ObjectId,
      amount,
      razorpayRefundId: `mock_rfnd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: RefundStatus.PROCESSED,
      createdAt: new Date(),
    };

    payment.refunds.push(refundEntry as any);
    await payment.save();

    const newTotalRefunded = currentRefunded + amount;
    if (newTotalRefunded >= payment.totalAmount) {
      order.paymentStatus = PaymentStatus.REFUNDED;
    } else {
      order.paymentStatus = PaymentStatus.PARTIALLY_REFUNDED;
    }
    await order.save();

    return {
      success: true,
      refund: refundEntry,
      orderPaymentStatus: order.paymentStatus,
    };
  }

  /**
   * Expiry job: checks orders with paymentStatus: created and expiresAt < now.
   * Marks them failed and cancels their bookings.
   */
  async sweepExpiredOrders() {
    const now = new Date();
    const expiredOrders = await this.orderModel
      .find({
        paymentStatus: PaymentStatus.CREATED,
        expiresAt: { $lt: now },
      })
      .exec();

    for (const ord of expiredOrders) {
      ord.paymentStatus = PaymentStatus.FAILED;
      await ord.save();

      await this.bookingModel
        .updateMany(
          { order: ord._id, status: BookingStatus.AWAITING_PROVIDER },
          {
            status: BookingStatus.CANCELLED,
            cancelledBy: CancelledBy.SYSTEM,
            cancelledReason: 'payment timeout',
          },
        )
        .exec();

      this.logger.log(
        `[Expiry Sweep] Order ${ord._id} expired and marked failed with bookings cancelled.`,
      );
    }
  }
}

