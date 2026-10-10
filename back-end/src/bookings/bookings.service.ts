import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../schema/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from '../common/enums';

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
    return this.bookingModel.find({ order: orderId }).exec();
  }

  findByCustomer(customerId: string) {
    return this.bookingModel
      .find({ customer: customerId })
      .sort({ createdAt: -1 })
      .populate('service provider order')
      .exec();
  }

  findByProvider(providerId: string) {
    return this.bookingModel
      .find({ provider: providerId })
      .sort({ scheduledDate: 1, startTime: 1 })
      .populate('service customer order')
      .exec();
  }

  findByRegionAndDate(regionId: string, date: Date) {
    return this.bookingModel
      .find({ region: regionId, scheduledDate: date })
      .populate('service provider customer')
      .exec();
  }

  /** Slot-holding bookings for a provider on a given date (for overlap checks). */
  findActiveByProviderAndDate(providerId: string, date: Date) {
    return this.bookingModel
      .find({
        provider: providerId,
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
