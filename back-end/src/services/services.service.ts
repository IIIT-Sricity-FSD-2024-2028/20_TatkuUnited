import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
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
import {
  getISTDateAndMinutes,
  parseAndValidateBookingDate,
} from '../common/utils/date.util';
import { RegionsService } from '../regions/regions.service';
import { ProvidersService } from '../providers/providers.service';

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
    @Optional()
    private readonly regionsService?: RegionsService,
    @Optional()
    private readonly providersService?: ProvidersService,
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
    const {
      dateString: validatedDate,
      targetDate,
      weekday: targetWeekday,
    } = parseAndValidateBookingDate(
      dateString,
      safeSettings.bookingWindowDays ?? 3,
    );

    // Resolve region for the customer coordinates (region is the gate, not 10km radius)
    const resolvedRegion = this.regionsService
      ? await this.regionsService.resolveForLocation(coords[0], coords[1])
      : null;

    if (this.regionsService && !resolvedRegion) {
      return {
        date: dateString,
        slots: [],
        serviceable: false,
        message: 'Service is not available in your area yet',
      };
    }

    const {
      candidates,
      activeBookings,
      unavailabilities,
    } = this.providersService && resolvedRegion
      ? await this.providersService.findEligibleProviders({
          regionId: resolvedRegion._id.toString(),
          serviceId,
          scheduledDate: targetDate,
          targetWeekday,
          location: coords,
          travelBufferMinutes: safeSettings.travelBufferMinutes ?? 30,
          maxRadiusKm: resolvedRegion.maxRadiusKm ?? null,
        })
      : { candidates: [], activeBookings: [], unavailabilities: [] };

    if (!candidates || candidates.length === 0) {
      return {
        date: dateString,
        slots: [],
        serviceable: true,
        regionName: resolvedRegion?.name,
        message: 'No eligible service providers in your area for this date',
      };
    }

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

