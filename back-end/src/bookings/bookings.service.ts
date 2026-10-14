import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../schema/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus, CancelledBy } from '../common/enums';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
  ) {}

  create(dto: CreateBookingDto) {
    return new this.bookingModel(dto).save();
  }

  findAll() {
    return this.bookingModel.find().exec();
  }

  findByOrder(orderId: string) {
    const order = Types.ObjectId.isValid(orderId)
      ? new Types.ObjectId(orderId)
      : orderId;
    return this.bookingModel.find({ order }).exec();
  }

  findByCustomer(customerId: string) {
    const customer = Types.ObjectId.isValid(customerId)
      ? new Types.ObjectId(customerId)
      : customerId;
    return this.bookingModel
      .find({ customer })
      .sort({ createdAt: -1 })
      .populate('service provider order')
      .exec();
  }

  findByProvider(providerId: string) {
    const provider = Types.ObjectId.isValid(providerId)
      ? new Types.ObjectId(providerId)
      : providerId;
    return this.bookingModel
      .find({ provider })
      .sort({ scheduledDate: 1, startTime: 1 })
      .populate('service customer order')
      .exec();
  }

  findByRegionAndDate(regionId: string, date: Date) {
    const region = Types.ObjectId.isValid(regionId)
      ? new Types.ObjectId(regionId)
      : regionId;
    return this.bookingModel
      .find({ region, scheduledDate: date })
      .populate('service provider customer')
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
      .populate('service provider customer')
      .exec();
  }

  /** Provider job offer inbox: awaiting_provider offers where offerExpiresAt is in future (§4.10) */
  findPendingOffersForProvider(providerId: string) {
    const provider = Types.ObjectId.isValid(providerId)
      ? new Types.ObjectId(providerId)
      : providerId;
    return this.bookingModel
      .find({
        provider,
        status: BookingStatus.AWAITING_PROVIDER,
        offerExpiresAt: { $gt: new Date() },
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
        status: BookingStatus.CANCELLED,
        cancelledBy: { $in: [CancelledBy.PROVIDER, CancelledBy.SYSTEM] },
      })
      .sort({ scheduledDate: -1, startTime: 1 })
      .populate('service provider customer order')
      .exec();
  }

  /** Provider accepts job offer (§4.10) */
  async acceptOffer(bookingId: string, providerId?: string) {
    const filter: any = {
      _id: bookingId,
      status: BookingStatus.AWAITING_PROVIDER,
      offerExpiresAt: { $gt: new Date() },
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
          status: BookingStatus.CONFIRMED,
          offerExpiresAt: null,
        },
        { new: true },
      )
      .populate('service customer order region')
      .exec();

    if (!booking) {
      throw new BadRequestException(
        'Offer has expired or is no longer available to accept',
      );
    }
    return booking;
  }

  /** Provider declines job offer (§4.10) */
  async rejectOffer(bookingId: string, providerId: string) {
    const filter: any = {
      _id: bookingId,
      status: BookingStatus.AWAITING_PROVIDER,
    };
    if (providerId) {
      filter.provider = Types.ObjectId.isValid(providerId)
        ? new Types.ObjectId(providerId)
        : providerId;
    }

    const pushId = Types.ObjectId.isValid(providerId)
      ? new Types.ObjectId(providerId)
      : providerId;

    const booking = await this.bookingModel
      .findOneAndUpdate(
        filter,
        {
          $addToSet: { declinedBy: pushId },
        },
        { new: true },
      )
      .exec();

    if (!booking) {
      throw new BadRequestException('Booking offer not found');
    }
    return booking;
  }

  /** Provider starts job (§4.11) */
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

    const booking = await this.bookingModel
      .findOneAndUpdate(
        filter,
        { status: BookingStatus.IN_PROGRESS },
        { new: true },
      )
      .populate('service customer order region')
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
      status: BookingStatus.IN_PROGRESS,
    };
    if (providerId) {
      filter.provider = Types.ObjectId.isValid(providerId)
        ? new Types.ObjectId(providerId)
        : providerId;
    }

    const booking = await this.bookingModel
      .findOneAndUpdate(
        filter,
        { status: BookingStatus.COMPLETED },
        { new: true },
      )
      .populate('service customer order region')
      .exec();

    if (!booking) {
      throw new BadRequestException(
        'Booking cannot be completed (must be in in_progress state)',
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

  /** Slot-holding bookings for a provider on a given date (for overlap checks). */
  findActiveByProviderAndDate(providerId: string, date: Date) {
    const provider = Types.ObjectId.isValid(providerId)
      ? new Types.ObjectId(providerId)
      : providerId;
    return this.bookingModel
      .find({
        provider,
        scheduledDate: date,
        status: {
          $in: [
            BookingStatus.PENDING,
            BookingStatus.AWAITING_PROVIDER,
            BookingStatus.CONFIRMED,
            BookingStatus.IN_PROGRESS,
          ],
        },
      })
      .exec();
  }

  async findOne(id: string) {
    const doc = await this.bookingModel
      .findById(id)
      .populate('service provider customer order region')
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
