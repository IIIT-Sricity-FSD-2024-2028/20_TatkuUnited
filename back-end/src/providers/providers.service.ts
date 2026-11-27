import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Provider, ProviderDocument } from '../schema/provider.schema';
import { Booking, BookingDocument } from '../schema/booking.schema';
import {
  Unavailability,
  UnavailabilityDocument,
} from '../schema/unavailability.schema';
import { Service, ServiceDocument } from '../schema/service.schema';
import { Region, RegionDocument } from '../schema/region.schema';
import { Manager, ManagerDocument } from '../schema/manager.schema';
import {
  BookingStatus,
  ManagerStatus,
  ProviderStatus,
  Role,
} from '../common/enums';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

export interface FindEligibleProvidersOptions {
  regionId: string | Types.ObjectId;
  serviceId: string | Types.ObjectId;
  scheduledDate: Date;
  targetWeekday: number;
  location: [number, number];
  travelBufferMinutes?: number;
  startTime?: number;
  endTime?: number;
  excludedProviderIds?: Types.ObjectId[];
  maxRadiusKm?: number | null;
  session?: ClientSession;
}

@Injectable()
export class ProvidersService {
  constructor(
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
    @Optional()
    @InjectModel(Booking.name)
    private readonly bookingModel?: Model<BookingDocument>,
    @Optional()
    @InjectModel(Unavailability.name)
    private readonly unavailabilityModel?: Model<UnavailabilityDocument>,
    @Optional()
    @InjectModel(Service.name)
    private readonly serviceModel?: Model<ServiceDocument>,
    @Optional()
    @InjectModel(Region.name)
    private readonly regionModel?: Model<RegionDocument>,
    @Optional()
    @InjectModel(Manager.name)
    private readonly managerModel?: Model<ManagerDocument>,
  ) {}

  create(dto: CreateProviderDto) {
    return new this.providerModel(dto).save();
  }

  findAll() {
    return this.providerModel.find().populate('user', '-password').exec();
  }

  async findOne(id: string) {
    const doc = await this.providerModel
      .findById(id)
      .populate('user', '-password')
      .exec();
    if (!doc) throw new NotFoundException(`Provider ${id} not found`);
    return doc;
  }

  findByUser(userId: string) {
    const user = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : userId;
    return this.providerModel.findOne({ user }).populate('user', '-password').exec();
  }

  findByRegion(regionId: string, status?: ProviderStatus | string) {
    const region = Types.ObjectId.isValid(regionId)
      ? new Types.ObjectId(regionId)
      : regionId;
    const filter: Record<string, unknown> = { region };
    if (status) {
      filter.status = status;
    }
    return this.providerModel.find(filter).populate('user', '-password').exec();
  }

  findByStatus(status: ProviderStatus | string) {
    return this.providerModel.find({ status: status as ProviderStatus }).populate('user', '-password').exec();
  }

  findByService(serviceId: string) {
    const service = Types.ObjectId.isValid(serviceId)
      ? new Types.ObjectId(serviceId)
      : serviceId;
    return this.providerModel
      .find({ offeredServices: service })
      .populate('user', '-password')
      .exec();
  }

  findUnassigned() {
    return this.providerModel
      .find({ $or: [{ region: null }, { region: { $exists: false } }] })
      .populate('user', '-password')
      .exec();
  }

  /**
   * Shared eligibility gate (Phase 4):
   * - Strictly gated on regionId, approved status, offeredServices, workingDays
   * - Sorted by distance from customer location via $geoNear
   * - Optional per-region maxRadiusKm cap (never a global 10km cutoff)
   * - Checks overlapping active bookings & unavailabilities
   */
  async findEligibleProviders(options: FindEligibleProvidersOptions): Promise<{
    candidates: any[];
    activeBookings: BookingDocument[];
    unavailabilities: UnavailabilityDocument[];
  }> {
    const {
      regionId,
      serviceId,
      scheduledDate,
      targetWeekday,
      location,
      travelBufferMinutes = 30,
      startTime,
      endTime,
      excludedProviderIds,
      maxRadiusKm,
      session,
    } = options;

    if (!regionId) {
      return { candidates: [], activeBookings: [], unavailabilities: [] };
    }

    const regionObjectId =
      typeof regionId === 'string' ? new Types.ObjectId(regionId) : regionId;
    const serviceObjectId =
      typeof serviceId === 'string' ? new Types.ObjectId(serviceId) : serviceId;

    const query: Record<string, any> = {
      region: regionObjectId,
      status: ProviderStatus.APPROVED,
      offeredServices: serviceObjectId,
      workingDays: targetWeekday,
    };

    if (typeof startTime === 'number' && typeof endTime === 'number') {
      query.workHourStart = { $lte: startTime };
      query.workHourEnd = { $gte: endTime };
    }

    if (excludedProviderIds && excludedProviderIds.length > 0) {
      query._id = { $nin: excludedProviderIds };
    }

    const geoNearStage = {
      near: { type: 'Point' as const, coordinates: location },
      distanceField: 'dist',
      spherical: true,
      query,
      ...(typeof maxRadiusKm === 'number' && maxRadiusKm > 0
        ? { maxDistance: maxRadiusKm * 1000 }
        : {}),
    };

    const agg = this.providerModel.aggregate([{ $geoNear: geoNearStage }]);
    if (session) {
      agg.session(session);
    }
    const candidates = await agg.exec();

    if (!candidates || candidates.length === 0) {
      return { candidates: [], activeBookings: [], unavailabilities: [] };
    }

    const candidateIds = candidates.map((c) => c._id);

    const [activeBookings, unavailabilities] = await Promise.all([
      this.bookingModel
        ? this.bookingModel
            .find({
              provider: { $in: candidateIds },
              scheduledDate,
              status: {
                $in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
              },
            })
            .session(session ?? null)
            .exec()
        : Promise.resolve([]),
      this.unavailabilityModel
        ? this.unavailabilityModel
            .find({
              provider: { $in: candidateIds },
              date: scheduledDate,
            })
            .session(session ?? null)
            .exec()
        : Promise.resolve([]),
    ]);

    if (typeof startTime !== 'number' || typeof endTime !== 'number') {
      return { candidates, activeBookings, unavailabilities };
    }

    const blockStartTime = startTime - travelBufferMinutes;
    const eligible = candidates.filter((candidate) => {
      const bookingConflict = activeBookings.some((b) => {
        if (b.provider?.toString() !== candidate._id?.toString()) return false;
        const bBlock = b.blockStartTime ?? b.startTime - travelBufferMinutes;
        return bBlock < endTime && b.endTime > blockStartTime;
      });
      if (bookingConflict) return false;

      const unavailConflict = unavailabilities.some((u) => {
        if (u.provider?.toString() !== candidate._id?.toString()) return false;
        return u.startTime < endTime && u.endTime > blockStartTime;
      });
      if (unavailConflict) return false;

      return true;
    });

    return { candidates: eligible, activeBookings, unavailabilities };
  }

  private async assertManagerCanEditProvider(
    provider: ProviderDocument,
    user: AuthenticatedUser,
    dto: UpdateProviderDto,
  ) {
    if (dto.region !== undefined) {
      const currentRegion = provider.region?.toString() ?? null;
      if (dto.region !== currentRegion) {
        throw new ForbiddenException(
          'Only admins can change a provider region',
        );
      }
    }

    if (!this.managerModel || !this.regionModel) return;
    const manager = await this.managerModel
      .findOne({
        user: new Types.ObjectId(user.userId),
        status: ManagerStatus.ACTIVE,
      })
      .exec();
    if (!manager) {
      throw new ForbiddenException('Active manager profile not found');
    }
    const managedRegions = await this.regionModel
      .find({ manager: manager._id })
      .select('_id')
      .exec();
    const managedIds = new Set(managedRegions.map((r) => r._id.toString()));
    if (!provider.region || !managedIds.has(provider.region.toString())) {
      throw new ForbiddenException(
        'You can only manage providers in your assigned region',
      );
    }
  }

  async update(
    id: string,
    dto: UpdateProviderDto,
    user?: AuthenticatedUser,
  ) {
    const existing = await this.providerModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Provider ${id} not found`);

    if (user) {
      if (user.role === Role.MANAGER) {
        await this.assertManagerCanEditProvider(existing, user, dto);
      } else if (user.role === Role.PROVIDER) {
        if (existing.user?.toString() !== user.userId) {
          throw new ForbiddenException(
            'You can only update your own provider profile',
          );
        }
        if (dto.status !== undefined || dto.region !== undefined) {
          throw new ForbiddenException(
            'Providers cannot modify their own status or region',
          );
        }
      }
    }

    if (dto.offeredServices && this.serviceModel) {
      const uniqueIds = Array.from(new Set(dto.offeredServices));
      if (uniqueIds.length > 0) {
        const activeCount = await this.serviceModel
          .countDocuments({
            _id: { $in: uniqueIds.map((sid) => new Types.ObjectId(sid)) },
            isActive: true,
          })
          .exec();
        if (activeCount !== uniqueIds.length) {
          throw new BadRequestException(
            'One or more offeredServices do not exist or are inactive',
          );
        }
      }
    }

    const doc = await this.providerModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('user', '-password')
      .exec();
    if (!doc) throw new NotFoundException(`Provider ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.providerModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Provider ${id} not found`);
    return doc;
  }
}
