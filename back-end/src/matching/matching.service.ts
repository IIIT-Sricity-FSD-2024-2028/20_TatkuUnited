import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../schema/booking.schema';
import { Order, OrderDocument } from '../schema/order.schema';
import { Provider, ProviderDocument } from '../schema/provider.schema';
import { Unavailability, UnavailabilityDocument } from '../schema/unavailability.schema';
import { Service, ServiceDocument } from '../schema/service.schema';
import {
  PlatformSetting,
  PlatformSettingDocument,
} from '../schema/platform-setting.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import {
  BookingStatus,
  CancelledBy,
  PaymentStatus,
  ProviderStatus,
} from '../common/enums';

@Injectable()
export class MatchingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchingService.name);
  private offerTimeoutInterval: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
    @InjectModel(Unavailability.name)
    private readonly unavailabilityModel: Model<UnavailabilityDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(PlatformSetting.name)
    private readonly platformSettingModel: Model<PlatformSettingDocument>,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) {}

  onModuleInit() {
    // Offer-timeout job: runs every 30 seconds per booking_workflow.md Section 4
    this.offerTimeoutInterval = setInterval(() => {
      this.sweepOfferTimeouts().catch((err) =>
        this.logger.error('Error sweeping offer timeouts:', err),
      );
    }, 30000);
    this.logger.log('MatchingService offer-timeout job scheduled (every 30s)');
  }

  onModuleDestroy() {
    if (this.offerTimeoutInterval) {
      clearInterval(this.offerTimeoutInterval);
      this.offerTimeoutInterval = null;
    }
  }

  private async getSettings(): Promise<PlatformSettingDocument> {
    let settings = await this.platformSettingModel.findOne().exec();
    if (!settings) {
      settings = await new this.platformSettingModel({
        platformFeePercent: 15,
        maxAssignmentDistanceKm: 15,
        slotIntervalMinutes: 30,
        firstSlotStart: 480,
        lastSlotStart: 1170,
        bookingWindowDays: 3,
        minLeadMinutes: 120,
        travelBufferMinutes: 30,
        offerTimeoutMinutes: 5,
        maxOfferRounds: 3,
        offerBatchSize: 5,
        payoutHoldHours: 0,
        matchWeights: { distance: 0.4, rating: 0.4, availability: 0.2 },
      }).save();
    }
    return settings;
  }

  private formatSlotTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  /**
   * Section 4: Matching and notifying providers.
   * Finds top qualifying providers, scores them, pushes offers, and creates notifications.
   */
  async offerBooking(bookingId: string): Promise<boolean> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      this.logger.warn(`offerBooking: Booking ${bookingId} not found`);
      return false;
    }

    if (booking.status !== BookingStatus.AWAITING_PROVIDER) {
      this.logger.log(
        `offerBooking: Booking ${bookingId} is not in awaiting_provider state (${booking.status})`,
      );
      return false;
    }

    if (booking.provider !== null) {
      this.logger.log(
        `offerBooking: Booking ${bookingId} is already assigned to provider ${booking.provider}`,
      );
      return false;
    }

    const order = await this.orderModel.findById(booking.order).exec();
    if (!order) {
      this.logger.warn(`offerBooking: Order ${booking.order} not found`);
      return false;
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      this.logger.warn(
        `offerBooking: Order ${order._id} is not paid (status: ${order.paymentStatus}). Skipping offer dispatch.`,
      );
      return false;
    }

    const serviceDoc = await this.serviceModel.findById(booking.service).exec();
    if (!serviceDoc) {
      this.logger.warn(`offerBooking: Service ${booking.service} not found`);
      return false;
    }

    const coords = order.address?.location?.coordinates;
    if (!coords || coords.length !== 2) {
      this.logger.warn(
        `offerBooking: Invalid location coordinates for order ${order._id}`,
      );
      return false;
    }

    const settings = await this.getSettings();
    const baseDistanceKm = settings.maxAssignmentDistanceKm || 15;
    const currentRound = booking.offerRound || 0;
    const radiusMultiplier = Math.pow(1.5, currentRound);
    const effectiveDistanceKm = baseDistanceKm * radiusMultiplier;
    const maxDistanceMetres = effectiveDistanceKm * 1000;
    const travelBuffer = settings.travelBufferMinutes || 30;
    const maxOfferRounds = settings.maxOfferRounds || 3;
    const offerBatchSize = settings.offerBatchSize || 5;
    const offerTimeoutMinutes = settings.offerTimeoutMinutes || 5;
    const weights = settings.matchWeights || {
      distance: 0.4,
      rating: 0.4,
      availability: 0.2,
    };

    // Providers already offered or declined for this booking
    const alreadyOfferedIds = (booking.offers || []).map((o) =>
      o.provider.toString(),
    );
    const declinedIds = (booking.declinedBy || []).map((d) => d.toString());
    const excludedIds = Array.from(
      new Set([...alreadyOfferedIds, ...declinedIds]),
    ).map((id) => new Types.ObjectId(id));

    // Target weekday
    const scheduledDate = new Date(booking.scheduledDate);
    const dateStr = scheduledDate.toISOString().slice(0, 10);
    const [y, m, d] = dateStr.split('-').map(Number);
    const targetWeekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

    const geoNearQuery: any = {
      status: ProviderStatus.APPROVED,
      offeredServices: booking.service,
      workingDays: targetWeekday,
      workHourStart: { $lte: booking.startTime },
      workHourEnd: { $gte: booking.endTime },
    };
    if (excludedIds.length > 0) {
      geoNearQuery._id = { $nin: excludedIds };
    }

    const candidates = await this.providerModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: coords },
          distanceField: 'dist',
          maxDistance: maxDistanceMetres,
          spherical: true,
          query: geoNearQuery,
        },
      },
    ]);

    const candidateIds = candidates.map((c) => c._id);
    const blockStartTime = booking.startTime - travelBuffer;

    let activeBookings: BookingDocument[] = [];
    let unavailabilities: UnavailabilityDocument[] = [];
    if (candidateIds.length > 0) {
      [activeBookings, unavailabilities] = await Promise.all([
        this.bookingModel
          .find({
            provider: { $in: candidateIds },
            scheduledDate: scheduledDate,
            status: {
              $in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
            },
          })
          .exec(),
        this.unavailabilityModel
          .find({
            provider: { $in: candidateIds },
            date: scheduledDate,
          })
          .exec(),
      ]);
    }


    const eligibleCandidates = candidates.filter((candidate) => {
      // 1. Overlapping active booking
      const bookingConflict = activeBookings.some((b) => {
        if (b.provider?.toString() !== candidate._id.toString()) return false;
        const bBlock = b.blockStartTime ?? b.startTime - travelBuffer;
        return bBlock < booking.endTime && b.endTime > blockStartTime;
      });
      if (bookingConflict) return false;

      // 2. Overlapping unavailability
      const unavailConflict = unavailabilities.some((u) => {
        if (u.provider?.toString() !== candidate._id.toString()) return false;
        return u.startTime < booking.endTime && u.endTime > blockStartTime;
      });
      if (unavailConflict) return false;

      return true;
    });

    if (eligibleCandidates.length === 0) {
      this.logger.log(
        `offerBooking: No candidates found for booking ${booking._id} in round ${currentRound} (radius ${effectiveDistanceKm.toFixed(1)}km)`,
      );

      // Section 4 Step 6: If no candidates exist, treat as failed round and go to timeout handling
      if (currentRound + 1 < maxOfferRounds) {
        booking.offerRound = currentRound + 1;
        await booking.save();
        this.logger.log(
          `Advancing booking ${booking._id} to offerRound ${booking.offerRound} with expanded radius`,
        );
        return this.offerBooking(booking._id.toString());
      } else {
        // Max rounds exhausted with no candidates
        this.logger.warn(
          `No providers available after ${maxOfferRounds} rounds for booking ${booking._id}. Cancelling and refunding.`,
        );
        booking.status = BookingStatus.CANCELLED;
        booking.cancelledBy = CancelledBy.SYSTEM;
        booking.cancelledReason = 'no provider available';
        booking.offerExpiresAt = null;
        await booking.save();

        await this.paymentsService.refund(
          booking._id.toString(),
          booking.price,
          'no provider available',
        );

        await this.notificationsService.create(
          booking.customer,
          'booking_cancelled',
          'No provider available for your booking. A full refund has been initiated.',
          booking._id,
        );
        return false;
      }
    }

    // Step 4: Scoring
    const slotDuration = booking.endTime - booking.startTime + travelBuffer;

    const scoredCandidates = eligibleCandidates.map((candidate) => {
      // 1. Distance score
      const distanceScore = Math.max(0, 1 - candidate.dist / maxDistanceMetres);

      // 2. Bayesian adjusted rating
      const C = 5;
      const m = 3.5;
      const rating = candidate.rating || 0;
      const ratingCount = candidate.ratingCount || 0;
      const bayesianRating = (C * m + rating * ratingCount) / (C + ratingCount);
      const ratingScore = bayesianRating / 5;

      // 3. Availability / day load score
      const dayLoad = activeBookings.filter(
        (b) => b.provider?.toString() === candidate._id.toString(),
      ).length;
      const workingMinutes = Math.max(
        60,
        candidate.workHourEnd - candidate.workHourStart,
      );
      const dailyCapacity = Math.max(
        1,
        Math.floor(workingMinutes / Math.max(30, slotDuration)),
      );
      const availabilityScore = Math.max(0, 1 - dayLoad / dailyCapacity);

      const score =
        weights.distance * distanceScore +
        weights.rating * ratingScore +
        weights.availability * availabilityScore;

      return { candidate, score };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);
    const selected = scoredCandidates.slice(0, offerBatchSize);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + offerTimeoutMinutes * 60 * 1000);

    booking.offerExpiresAt = expiresAt;
    for (const item of selected) {
      booking.offers.push({
        provider: item.candidate._id,
        status: 'offered',
        offeredAt: now,
        expiresAt: expiresAt,
      } as any);
    }
    await booking.save();

    // Step 5: Notifications
    const timeStr = this.formatSlotTime(booking.startTime);
    const rupees = Math.round(booking.providerShare / 100);

    for (const item of selected) {
      const distKm = (item.candidate.dist / 1000).toFixed(1);
      const msg = `New job: ${serviceDoc.name}, ${dateStr} ${timeStr}, ${distKm} km, earn ₹${rupees}`;
      await this.notificationsService.create(
        item.candidate.user,
        'job_offer',
        msg,
        booking._id,
      );
    }

    this.logger.log(
      `offerBooking: Dispatched offers to ${selected.length} providers for booking ${booking._id} (round ${currentRound})`,
    );
    return true;
  }

  /**
   * Offer-timeout sweep: runs every 30 seconds.
   * Finds awaiting_provider bookings for paid orders whose open offers have all expired or been declined,
   * or bookings with empty offers array (e.g. server restart between payment and matching).
   */
  async sweepOfferTimeouts() {
    const now = new Date();
    const awaitingBookings = await this.bookingModel
      .find({ status: BookingStatus.AWAITING_PROVIDER })
      .exec();

    for (const b of awaitingBookings) {
      try {
        const order = await this.orderModel.findById(b.order).exec();
        if (!order || order.paymentStatus !== PaymentStatus.PAID) {
          continue;
        }

        // Rule: The offer-timeout job must also pick up paid awaiting_provider bookings with an empty
        // offers array (in case the server died between payment and matching).
        if (!b.offers || b.offers.length === 0) {
          this.logger.log(
            `[Offer-Timeout Job] Picking up paid awaiting_provider booking ${b._id} with empty offers array`,
          );
          await this.offerBooking(b._id.toString());
          continue;
        }

        // Check if there are active offers still awaiting response
        const hasActiveOffer = b.offers.some(
          (o) => o.status === 'offered' && new Date(o.expiresAt) > now,
        );
        if (hasActiveOffer) {
          continue;
        }

        // All open offers have either expired or been declined
        this.logger.log(
          `[Offer-Timeout Job] Booking ${b._id} has no active offers remaining in round ${b.offerRound}`,
        );
        await this.handleOfferTimeoutOrDeclined(b._id.toString());
      } catch (err) {
        this.logger.error(
          `[Offer-Timeout Job] Error processing booking ${b._id}:`,
          err,
        );
      }
    }
  }

  /**
   * Advances an expired/all-declined booking to next round, or cancels & refunds if rounds exhausted.
   */
  async handleOfferTimeoutOrDeclined(bookingId: string) {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking || booking.status !== BookingStatus.AWAITING_PROVIDER) {
      return;
    }
    if (booking.provider !== null) {
      return; // Already accepted
    }

    const now = new Date();
    let modified = false;
    for (const o of booking.offers) {
      if (o.status === 'offered' && new Date(o.expiresAt) <= now) {
        o.status = 'expired';
        modified = true;
      }
    }
    if (modified) {
      await booking.save();
    }

    const settings = await this.getSettings();
    const maxOfferRounds = settings.maxOfferRounds || 3;
    const currentRound = booking.offerRound || 0;

    if (currentRound + 1 < maxOfferRounds) {
      booking.offerRound = currentRound + 1;
      await booking.save();
      this.logger.log(
        `[Offer-Timeout] Advancing booking ${booking._id} to offerRound ${booking.offerRound}`,
      );
      await this.offerBooking(booking._id.toString());
    } else {
      this.logger.warn(
        `[Offer-Timeout] Max rounds (${maxOfferRounds}) exhausted for booking ${booking._id}. Cancelling and refunding.`,
      );
      booking.status = BookingStatus.CANCELLED;
      booking.cancelledBy = CancelledBy.SYSTEM;
      booking.cancelledReason = 'no provider available';
      booking.offerExpiresAt = null;
      await booking.save();

      await this.paymentsService.refund(
        booking._id.toString(),
        booking.price,
        'no provider available',
      );

      await this.notificationsService.create(
        booking.customer,
        'booking_cancelled',
        'No provider available for your booking. A full refund has been initiated.',
        booking._id,
      );
    }
  }
}
