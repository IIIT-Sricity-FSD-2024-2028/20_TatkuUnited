import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from '../schema/service.schema';
import { Provider, ProviderDocument } from '../schema/provider.schema';
import { Booking, BookingDocument } from '../schema/booking.schema';
import {
  Unavailability,
  UnavailabilityDocument,
} from '../schema/unavailability.schema';
import {
  PlatformSetting,
  PlatformSettingDocument,
} from '../schema/platform-setting.schema';
import { User, UserDocument } from '../schema/user.schema';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

function getISTDateAndMinutes(now: Date = new Date()) {
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 330 * 60000);
  const istDateString = ist.toISOString().slice(0, 10);
  const istMinutes = ist.getHours() * 60 + ist.getMinutes();
  return { istDateString, istMinutes };
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Unavailability.name)
    private readonly unavailabilityModel: Model<UnavailabilityDocument>,
    @InjectModel(PlatformSetting.name)
    private readonly platformSettingModel: Model<PlatformSettingDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  create(dto: CreateServiceDto) {
    return new this.serviceModel(dto).save();
  }

  findAll(categoryId?: string, includeAll = false) {
    const filter: Record<string, unknown> = includeAll
      ? {}
      : { isActive: true };
    if (categoryId && categoryId !== 'all') {
      filter.category = Types.ObjectId.isValid(categoryId)
        ? new Types.ObjectId(categoryId)
        : categoryId;
    }
    return this.serviceModel.find(filter).populate('category').exec();
  }

  async findOne(id: string) {
    const doc = await this.serviceModel
      .findById(id)
      .populate('category')
      .exec();
    if (!doc) throw new NotFoundException(`Service ${id} not found`);
    return doc;
  }

  async update(id: string, dto: UpdateServiceDto) {
    const doc = await this.serviceModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException(`Service ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.serviceModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Service ${id} not found`);
    return doc;
  }

  /**
   * Section 1: Calculate available slots for service, date, and customer address.
   * Matches rules from db_docs 4.6 & booking_workflow 4.2.
   */
  async getAvailableSlots(
    serviceId: string,
    dateString: string,
    addressId?: string,
    customerId?: string,
    lat?: number,
    lng?: number,
  ) {
    const service = await this.serviceModel.findById(serviceId).exec();
    if (!service || !service.isActive) {
      throw new NotFoundException('Service not found or inactive');
    }

    let settings = await this.platformSettingModel.findOne().exec();
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

    // Determine customer coordinates
    let coords: [number, number] | null = null;
    if (typeof lng === 'number' && typeof lat === 'number') {
      coords = [lng, lat];
    } else if (customerId) {
      const user = await this.userModel.findById(customerId).exec();
      if (user && user.addresses && user.addresses.length > 0) {
        if (addressId) {
          const addr = user.addresses.find(
            (a: any) => a.id === addressId || a._id?.toString() === addressId,
          );
          if (addr?.location?.coordinates) {
            coords = addr.location.coordinates as [number, number];
          }
        }
        if (!coords && user.addresses[0]?.location?.coordinates) {
          coords = user.addresses[0].location.coordinates as [number, number];
        }
      }
    }

    if (!coords) {
      throw new BadRequestException(
        'Delivery address location coordinates are required to check slot availability',
      );
    }

    const { istDateString, istMinutes } = getISTDateAndMinutes();
    const [y, m, d] = dateString.split('-').map(Number);
    if (!y || !m || !d) {
      throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
    }
    const targetDate = new Date(`${dateString}T00:00:00.000Z`);
    const targetWeekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

    // Query qualified candidate providers within distance
    const maxDistanceMetres = (safeSettings.maxAssignmentDistanceKm || 10) * 1000;
    const candidates = await this.providerModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: coords },
          distanceField: 'dist',
          maxDistance: maxDistanceMetres,
          spherical: true,
          query: {
            status: 'approved',
            offeredServices: new Types.ObjectId(serviceId),
            workingDays: targetWeekday,
          },
        },
      },
    ]);

    if (!candidates || candidates.length === 0) {
      return {
        date: dateString,
        slots: [],
        message: 'No eligible service providers in your area for this date',
      };
    }

    const candidateIds = candidates.map((c) => c._id);

    // Fetch active bookings (confirmed, in_progress)
    const activeBookings = await this.bookingModel
      .find({
        provider: { $in: candidateIds },
        scheduledDate: targetDate,
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
      })
      .exec();

    // Fetch provider unavailabilities on this date
    const unavailabilities = await this.unavailabilityModel
      .find({
        provider: { $in: candidateIds },
        date: targetDate,
      })
      .exec();

    const availableSlots: Array<{
      startTime: number;
      endTime: number;
      time: string;
      available: boolean;
    }> = [];

    const slotInterval = safeSettings.slotIntervalMinutes || 30;
    const firstSlot = safeSettings.firstSlotStart ?? 480;
    const lastSlot = safeSettings.lastSlotStart ?? 1170;
    const minLead = safeSettings.minLeadMinutes ?? 120;
    const travelBuffer = safeSettings.travelBufferMinutes ?? 30;

    for (let startTime = firstSlot; startTime <= lastSlot; startTime += slotInterval) {
      // Check lead time if booking for today
      if (dateString === istDateString && startTime < istMinutes + minLead) {
        continue;
      }

      const endTime = startTime + service.duration;
      const blockStartTime = startTime - travelBuffer;

      // Check if at least one candidate passes qualification
      const hasProvider = candidates.some((candidate) => {
        // 1. Fits within work hours
        if (candidate.workHourStart > startTime || endTime > candidate.workHourEnd) {
          return false;
        }

        // 2. No overlapping active booking
        const hasBookingConflict = activeBookings.some((b) => {
          if (b.provider?.toString() !== candidate._id?.toString()) return false;
          const bBlockStart =
            b.blockStartTime ?? (b.startTime - travelBuffer);
          return bBlockStart < endTime && b.endTime > blockStartTime;
        });
        if (hasBookingConflict) return false;

        // 3. No overlapping unavailability
        const hasUnavailConflict = unavailabilities.some((u) => {
          if (u.provider?.toString() !== candidate._id?.toString()) return false;
          return u.startTime < endTime && u.endTime > blockStartTime;
        });
        if (hasUnavailConflict) return false;

        return true;
      });

      if (hasProvider) {
        const hours = Math.floor(startTime / 60);
        const mins = startTime % 60;
        const time = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        availableSlots.push({
          startTime,
          endTime,
          time,
          available: true,
        });
      }
    }

    return {
      date: dateString,
      service: {
        id: service._id,
        name: service.name,
        duration: service.duration,
        price: service.price,
      },
      slots: availableSlots,
    };
  }
}

