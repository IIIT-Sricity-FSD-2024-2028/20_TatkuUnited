import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  UnauthorizedException,
  Logger,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../schema/booking.schema';
import { Provider, ProviderDocument } from '../schema/provider.schema';
import {
  Unavailability,
  UnavailabilityDocument,
} from '../schema/unavailability.schema';
import { User, UserDocument } from '../schema/user.schema';
import {
  PlatformSetting,
  PlatformSettingDocument,
} from '../schema/platform-setting.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { MatchingService } from '../matching/matching.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import {
  BookingStatus,
  CancelledBy,
  PayoutStatus,
  ProviderStatus,
  UserStatus,
  Role,
} from '../common/enums';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Injectable()
export class BookingsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BookingsService.name);
  private payoutSweepInterval: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
    @InjectModel(Unavailability.name)
    private readonly unavailabilityModel: Model<UnavailabilityDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(PlatformSetting.name)
    private readonly platformSettingModel: Model<PlatformSettingDocument>,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => MatchingService))
    private readonly matchingService: MatchingService,
  ) {}

  onModuleInit() {
    this.payoutSweepInterval = setInterval(() => {
      this.releaseDuePayouts().catch((err) =>
        this.logger.error('Error releasing due payouts:', err),
      );
    }, 60000);
  }

  onModuleDestroy() {
    if (this.payoutSweepInterval) {
      clearInterval(this.payoutSweepInterval);
      this.payoutSweepInterval = null;
    }
  }

  async releaseDuePayouts() {
    const result = await this.bookingModel
      .updateMany(
        {
          status: BookingStatus.COMPLETED,
          payoutStatus: PayoutStatus.PENDING,
          payoutAt: { $ne: null, $lte: new Date() },
        },
        { $set: { payoutStatus: PayoutStatus.PAID } },
      )
      .exec();
    return result.modifiedCount ?? 0;
  }

  create(dto: CreateBookingDto) {
    return new this.bookingModel(dto).save();
  }

  findAll() {
    return this.bookingModel
      .find()
      .populate('service customer order region')
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .exec();
  }

  findByOrder(orderId: string) {
    const order = Types.ObjectId.isValid(orderId)
      ? new Types.ObjectId(orderId)
      : orderId;
    return this.bookingModel
      .find({ order })
      .populate('service order region')
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .exec();
  }

  findByCustomer(customerId: string) {
    const customer = Types.ObjectId.isValid(customerId)
      ? new Types.ObjectId(customerId)
      : customerId;
    return this.bookingModel
      .find({ customer })
      .sort({ createdAt: -1 })
      .populate('service order region')
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .exec();
  }

  findByProvider(providerId: string) {
    const provider = Types.ObjectId.isValid(providerId)
      ? new Types.ObjectId(providerId)
      : providerId;
    return this.bookingModel
      .find({ provider })
      .sort({ scheduledDate: 1, startTime: 1 })
      .populate('service customer order region')
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .exec();
  }

  findByRegionAndDate(regionId: string, date: Date) {
    const region = Types.ObjectId.isValid(regionId)
      ? new Types.ObjectId(regionId)
      : regionId;
    return this.bookingModel
      .find({ region, scheduledDate: date })
      .populate('service provider customer order')
      .exec();
  }

  findByRegion(regionId: string, date?: string) {
    const region = Types.ObjectId.isValid(regionId)
      ? new Types.ObjectId(regionId)
      : regionId;
    const filter: Record<string, unknown> = { region };
    if (date) {
      filter.scheduledDate = new Date(date);
    }
    return this.bookingModel
      .find(filter)
      .sort({ scheduledDate: 1, startTime: 1 })
      .populate('service provider customer order')
      .exec();
  }

  /**
   * Provider job offer inbox (§4.10):
   * Awaiting_provider offers where offers.provider matches providerId and expiresAt is in the future.
   */
  findPendingOffersForProvider(providerId: string) {
    const provider = Types.ObjectId.isValid(providerId)
      ? new Types.ObjectId(providerId)
      : providerId;
    return this.bookingModel
      .find({
        status: BookingStatus.AWAITING_PROVIDER,
        offers: {
          $elemMatch: {
            provider,
            status: 'offered',
            expiresAt: { $gt: new Date() },
          },
        },
      })
      .sort({ scheduledDate: 1, startTime: 1 })
      .populate('service customer order region')
      .exec();
  }

  /** Provider active/confirmed schedule (§4.10, §4.11) */
  findScheduleForProvider(providerId: string, date?: string) {
    const provider = Types.ObjectId.isValid(providerId)
      ? new Types.ObjectId(providerId)
      : providerId;
    const filter: Record<string, unknown> = {
      provider,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
    };
    if (date) {
      filter.scheduledDate = new Date(date);
    }
    return this.bookingModel
      .find(filter)
      .sort({ scheduledDate: 1, startTime: 1 })
      .populate('service customer order region')
      .exec();
  }

  /** Manager screen: Problem bookings in region (cancelled by provider or system) (§4.16) */
  findProblemBookingsByRegion(regionId: string) {
    const region = Types.ObjectId.isValid(regionId)
      ? new Types.ObjectId(regionId)
      : regionId;
    return this.bookingModel
      .find({
        region,
        $or: [
          { status: BookingStatus.DISPUTED },
          {
            status: BookingStatus.CANCELLED,
            cancelledBy: { $in: [CancelledBy.PROVIDER, CancelledBy.SYSTEM] },
          },
        ],
      })
      .sort({ scheduledDate: -1, startTime: 1 })
      .populate('service provider customer order')
      .exec();
  }

  /**
   * Section 4: Provider accepts job offer (First-accept workflow).
   * - Takes caller identity strictly from JWT.
   * - Runs in an atomic transaction with provider lock.
   * - Checks for overlapping bookings and unavailability.
   * - Catches WriteConflict / TransientTransactionError and returns clean 409 "already taken".
   * - Populates provider.user.name for customer view.
   */
  async acceptOffer(bookingId: string, user: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    let me: Types.ObjectId;
    let providerDoc: ProviderDocument | null = null;

    if (user.role === Role.PROVIDER) {
      providerDoc = await this.providerModel
        .findOne({ user: user.userId })
        .exec();
      if (!providerDoc) {
        throw new ForbiddenException('Provider profile not found for user');
      }
      if (providerDoc.status !== ProviderStatus.APPROVED) {
        throw new ForbiddenException('Provider is not approved to accept jobs');
      }
      me = providerDoc._id as Types.ObjectId;
    } else if (user.role === Role.ADMIN) {
      providerDoc = await this.providerModel
        .findOne({ user: user.userId })
        .exec();
      if (!providerDoc) {
        throw new ForbiddenException(
          'Admin user has no linked provider profile',
        );
      }
      me = providerDoc._id as Types.ObjectId;
    } else {
      throw new ForbiddenException('Only service providers can accept offers');
    }

    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (booking.status !== BookingStatus.AWAITING_PROVIDER) {
      throw new ConflictException('This job was already taken');
    }

    // Check that the booking offer belongs to the caller
    const myOffer = (booking.offers || []).find(
      (o) => o.provider?.toString() === me.toString(),
    );
    if (!myOffer) {
      throw new ForbiddenException('You do not have an offer for this booking');
    }

    if (myOffer.status === 'declined') {
      throw new BadRequestException('You have already declined this offer');
    }

    if (myOffer.status !== 'offered') {
      throw new ConflictException('This job was already taken');
    }

    const now = new Date();
    if (new Date(myOffer.expiresAt) <= now) {
      throw new ConflictException('This job was already taken');
    }

    const session = await this.bookingModel.db.startSession();
    session.startTransaction();

    let updatedBooking: BookingDocument | null = null;
    try {
      // 1. Lock the provider: Provider.updateOne({_id: me}, {$currentDate: {updatedAt: true}})
      await this.providerModel.updateOne(
        { _id: me },
        { $currentDate: { updatedAt: true } },
        { session },
      );

      // 2. Re-check that the provider still has no overlapping booking or unavailability
      const settings = await this.platformSettingModel
        .findOne()
        .session(session)
        .exec();
      const travelBuffer = settings?.travelBufferMinutes || 30;
      const blockStartTime = booking.startTime - travelBuffer;

      const conflictBooking = await this.bookingModel
        .findOne({
          provider: me,
          scheduledDate: booking.scheduledDate,
          status: {
            $in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
          },
          blockStartTime: { $lt: booking.endTime },
          endTime: { $gt: blockStartTime },
        })
        .session(session)
        .exec();

      if (conflictBooking) {
        throw new BadRequestException(
          'You have a conflicting booking for this time slot',
        );
      }

      const conflictUnavail = await this.unavailabilityModel
        .findOne({
          provider: me,
          date: booking.scheduledDate,
          startTime: { $lt: booking.endTime },
          endTime: { $gt: blockStartTime },
        })
        .session(session)
        .exec();

      if (conflictUnavail) {
        throw new BadRequestException(
          'You have an unavailability block for this time slot',
        );
      }

      // 3. Booking.findOneAndUpdate
      updatedBooking = await this.bookingModel
        .findOneAndUpdate(
          {
            _id: booking._id,
            provider: null,
            status: BookingStatus.AWAITING_PROVIDER,
            offers: {
              $elemMatch: {
                provider: me,
                status: 'offered',
                expiresAt: { $gt: new Date() },
              },
            },
          },
          {
            $set: {
              provider: me,
              status: BookingStatus.CONFIRMED,
              offerExpiresAt: null,
              'offers.$[myOffer].status': 'accepted',
              'offers.$[otherOffers].status': 'expired',
            },
          },
          {
            arrayFilters: [
              { 'myOffer.provider': me },
              {
                'otherOffers.provider': { $ne: me },
                'otherOffers.status': 'offered',
              },
            ],
            new: true,
            session,
          },
        )
        .populate('service customer order region')
        .populate({
          path: 'provider',
          populate: {
            path: 'user',
            select: 'name email phone',
          },
        })
        .exec();

      if (!updatedBooking) {
        throw new ConflictException('This job was already taken');
      }

      await session.commitTransaction();
    } catch (err: any) {
      await session.abortTransaction();

      // Catch WriteConflict / TransientTransactionError and return a clean 409 "already taken", never a 500
      if (
        err?.code === 112 ||
        err?.codeName === 'WriteConflict' ||
        err?.name === 'WriteConflict' ||
        err?.hasErrorLabel?.('TransientTransactionError') ||
        (typeof err?.message === 'string' &&
          (err.message.includes('WriteConflict') ||
            err.message.includes('Write conflict') ||
            err.message.includes('TransientTransactionError') ||
            err.message.includes('already taken')))
      ) {
        throw new ConflictException('This job was already taken');
      }
      throw err;
    } finally {
      await session.endSession();
    }

    // 5. Notify customer ("Your provider is <name>") and the other offered providers ("Job taken")
    const providerUser = await this.userModel.findById(providerDoc.user).exec();
    const providerName = providerUser?.name || 'A service professional';

    await this.notificationsService.create(
      (updatedBooking as any).customer?._id || (updatedBooking as any).customer,
      'booking_confirmed',
      `Your provider is ${providerName}`,
      updatedBooking._id,
    );

    for (const off of booking.offers || []) {
      if (off.provider?.toString() !== me.toString()) {
        const otherProv = await this.providerModel
          .findById(off.provider)
          .exec();
        if (otherProv?.user) {
          await this.notificationsService.create(
            otherProv.user,
            'job_taken',
            'Job taken',
            updatedBooking._id,
          );
        }
      }
    }

    return updatedBooking;
  }

  /**
   * Section 4: Provider declines job offer.
   * Marks offer declined and pushes provider into declinedBy.
   */
  async rejectOffer(bookingId: string, user: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    let me: Types.ObjectId;
    if (user.role === Role.PROVIDER || user.role === Role.ADMIN) {
      const providerDoc = await this.providerModel
        .findOne({ user: user.userId })
        .exec();
      if (!providerDoc) {
        throw new ForbiddenException('Provider profile not found for user');
      }
      me = providerDoc._id as Types.ObjectId;
    } else {
      throw new ForbiddenException('Only service providers can decline offers');
    }

    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (booking.status !== BookingStatus.AWAITING_PROVIDER) {
      throw new BadRequestException('Booking is no longer awaiting provider');
    }

    const myOffer = (booking.offers || []).find(
      (o) => o.provider?.toString() === me.toString(),
    );
    if (!myOffer) {
      throw new ForbiddenException('You do not have an offer for this booking');
    }

    const updated = await this.bookingModel
      .findOneAndUpdate(
        {
          _id: booking._id,
          status: BookingStatus.AWAITING_PROVIDER,
          'offers.provider': me,
        },
        {
          $set: { 'offers.$.status': 'declined' },
          $addToSet: { declinedBy: me },
        },
        { new: true },
      )
      .exec();

    // If no active offers remain, immediately advance to next round
    const remainingOpenOffers = (updated?.offers || []).some(
      (o) => o.status === 'offered' && new Date(o.expiresAt) > new Date(),
    );
    if (!remainingOpenOffers) {
      this.matchingService
        .handleOfferTimeoutOrDeclined(booking._id.toString())
        .catch((err) =>
          this.logger.error('Error handling offer timeout after decline:', err),
        );
    }

    return {
      success: true,
      message: 'Booking offer declined',
      bookingId: booking._id.toString(),
    };
  }

  /** Provider starts job (§4.11) */
  async assertExecutionAccess(bookingId: string, user: AuthenticatedUser) {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) throw new NotFoundException('Booking not found');
    if (user.role === Role.ADMIN) return;
    if (user.role === Role.PROVIDER) {
      const provider = await this.providerModel
        .findOne({ user: user.userId })
        .exec();
      if (provider && booking.provider?.toString() === provider._id.toString())
        return;
    }
    if (user.role === Role.MANAGER) {
      const manager = await this.bookingModel.db
        .model('Manager')
        .findOne({ user: user.userId, status: 'active' });
      if (
        manager &&
        (await this.bookingModel.db
          .model('Region')
          .exists({ _id: booking.region, manager: manager._id }))
      )
        return;
    }
    throw new ForbiddenException('You cannot change this booking');
  }

  async startJob(bookingId: string, providerId?: string) {
    const filter: any = {
      _id: bookingId,
      status: BookingStatus.CONFIRMED,
    };
    if (providerId) {
      filter.provider = Types.ObjectId.isValid(providerId)
        ? new Types.ObjectId(providerId)
        : providerId;
    }

    const existing = await this.bookingModel.findOne(filter).exec();
    if (!existing) {
      throw new BadRequestException(
        'Booking cannot be started (must be in confirmed state)',
      );
    }

    const settings = await this.platformSettingModel.findOne().exec();
    const graceMinutes = settings?.startGraceMinutes ?? 60;
    // scheduledDate is midnight UTC for the IST calendar day; startTime is minutes from IST midnight (UTC+5:30 = +330m)
    const scheduledStartMs =
      new Date(existing.scheduledDate).getTime() +
      (existing.startTime - 330) * 60_000;
    if (Date.now() < scheduledStartMs - graceMinutes * 60_000) {
      throw new BadRequestException(
        `Job cannot be started more than ${graceMinutes} minutes before the scheduled start time`,
      );
    }

    const booking = await this.bookingModel
      .findOneAndUpdate(
        filter,
        { status: BookingStatus.IN_PROGRESS },
        { new: true },
      )
      .populate('service customer order region')
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .exec();

    if (!booking) {
      throw new BadRequestException(
        'Booking cannot be started (must be in confirmed state)',
      );
    }
    return booking;
  }

  /** Provider completes job (§4.11) */
  async completeJob(bookingId: string, providerId?: string) {
    const filter: any = {
      _id: bookingId,
      status: {
        $in: [
          BookingStatus.IN_PROGRESS,
          BookingStatus.COMPLETION_REQUESTED,
          BookingStatus.DISPUTED,
        ],
      },
    };
    if (providerId) {
      filter.provider = Types.ObjectId.isValid(providerId)
        ? new Types.ObjectId(providerId)
        : providerId;
    }

    const booking = await this.bookingModel
      .findOneAndUpdate(
        filter,
        {
          status: BookingStatus.COMPLETED,
          completedAt: new Date(),
        },
        { new: true },
      )
      .populate('service customer order region')
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .exec();

    if (!booking) {
      throw new BadRequestException(
        'Booking cannot be completed (must be in in_progress state)',
      );
    }
    return booking;
  }

  async requestCompletion(bookingId: string, user: AuthenticatedUser) {
    const provider = await this.providerModel
      .findOne({ user: user.userId })
      .exec();
    if (!provider) throw new ForbiddenException('Provider profile not found');

    const booking = await this.bookingModel
      .findOneAndUpdate(
        {
          _id: bookingId,
          provider: provider._id,
          status: BookingStatus.IN_PROGRESS,
        },
        { status: BookingStatus.COMPLETION_REQUESTED },
        { new: true },
      )
      .populate('service customer order region')
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name email phone' },
      })
      .exec();

    if (!booking) {
      throw new BadRequestException(
        'Only an in-progress assigned booking can request completion',
      );
    }
    return booking;
  }

  async confirmCompletion(bookingId: string, user: AuthenticatedUser) {
    const settings = await this.platformSettingModel.findOne().exec();
    const holdHours = settings?.payoutHoldHours ?? 0;
    const now = new Date();
    const payoutAt =
      holdHours <= 0 ? now : new Date(now.getTime() + holdHours * 3600_000);
    const payoutStatus =
      holdHours <= 0 ? PayoutStatus.PAID : PayoutStatus.PENDING;

    const booking = await this.bookingModel
      .findOneAndUpdate(
        {
          _id: bookingId,
          customer: user.userId,
          status: BookingStatus.COMPLETION_REQUESTED,
        },
        {
          status: BookingStatus.COMPLETED,
          completedAt: now,
          payoutStatus,
          payoutAt,
        },
        { new: true },
      )
      .populate('service customer order region')
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name email phone' },
      })
      .exec();

    if (!booking) {
      throw new BadRequestException(
        'Completion request not found for this customer',
      );
    }
    return booking;
  }

  async rejectCompletion(
    bookingId: string,
    user: AuthenticatedUser,
    reason?: string,
  ) {
    const existing = await this.bookingModel
      .findOne({
        _id: bookingId,
        customer: user.userId,
        status: BookingStatus.COMPLETION_REQUESTED,
      })
      .exec();

    if (!existing) {
      throw new BadRequestException(
        'Completion request not found for this customer',
      );
    }

    const attempts = existing.completionAttempts ?? 0;
    const isRetry = attempts === 0;
    const nextStatus = isRetry
      ? BookingStatus.IN_PROGRESS
      : BookingStatus.DISPUTED;

    const booking = await this.bookingModel
      .findOneAndUpdate(
        {
          _id: bookingId,
          customer: user.userId,
          status: BookingStatus.COMPLETION_REQUESTED,
        },
        {
          status: nextStatus,
          completionAttempts: attempts + 1,
          completionRejectionReason: reason?.trim() || null,
          completionRejectedAt: new Date(),
        },
        { new: true },
      )
      .populate('service customer order region')
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name email phone' },
      })
      .exec();

    if (!booking) {
      throw new BadRequestException(
        'Completion request not found for this customer',
      );
    }

    if (isRetry) {
      try {
        const providerUserId = (booking.provider as any)?.user?._id;
        if (providerUserId) {
          const reasonSuffix = reason?.trim() ? ` Reason: ${reason.trim()}` : '';
          await this.notificationsService.create(
            providerUserId,
            'completion_rejected',
            `Customer requested rework before confirming completion.${reasonSuffix}`,
            booking._id as Types.ObjectId,
          );
        }
      } catch (error) {
        this.logger.error(
          'Unable to notify provider of completion rejection retry',
          error,
        );
      }
      return booking;
    }

    // Second rejection escalates to DISPUTED: notify regional manager(s) AND active admins
    try {
      const recipientIds = new Set<string>();
      const admins = await this.userModel
        .find({ role: Role.ADMIN, status: UserStatus.ACTIVE })
        .select('_id')
        .exec();
      for (const admin of admins) {
        recipientIds.add(admin._id.toString());
      }

      const regionId =
        (booking.region as any)?._id?.toString() || booking.region?.toString();
      if (regionId) {
        const regionDoc: any = await this.bookingModel.db
          .model('Region')
          .findById(regionId)
          .exec();
        if (regionDoc?.manager) {
          const managerDoc: any = await this.bookingModel.db
            .model('Manager')
            .findById(regionDoc.manager)
            .exec();
          if (managerDoc?.user) {
            recipientIds.add(managerDoc.user.toString());
          }
        }
      }

      await Promise.all(
        Array.from(recipientIds).map((uid) =>
          this.notificationsService.create(
            new Types.ObjectId(uid),
            'completion_disputed',
            'A customer reported incomplete work. Review the disputed booking before resolving it.',
            booking._id as Types.ObjectId,
          ),
        ),
      );
    } catch (error) {
      this.logger.error(
        'Unable to notify managers/administrators of persisted booking dispute',
        error,
      );
    }
    return booking;
  }

  /** Cancel booking with actor and reason (§4.14) */
  async cancelBooking(
    bookingId: string,
    cancelledBy: CancelledBy,
    reason?: string,
  ) {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Completed bookings cannot be cancelled');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledBy = cancelledBy;
    booking.cancelledReason = reason || null;
    booking.offerExpiresAt = null;
    return booking.save();
  }

  /** Slot-holding bookings for a provider on a given date (for overlap checks) */
  findActiveByProviderAndDate(providerId: string, date: Date) {
    const provider = Types.ObjectId.isValid(providerId)
      ? new Types.ObjectId(providerId)
      : providerId;
    return this.bookingModel
      .find({
        provider,
        scheduledDate: date,
        status: {
          $in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
        },
      })
      .exec();
  }

  async findOne(id: string) {
    const doc = await this.bookingModel
      .findById(id)
      .populate('service customer order region')
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .exec();
    if (!doc) throw new NotFoundException(`Booking ${id} not found`);
    return doc;
  }

  async update(id: string, dto: UpdateBookingDto) {
    const doc = await this.bookingModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException(`Booking ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.bookingModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Booking ${id} not found`);
    return doc;
  }
}
