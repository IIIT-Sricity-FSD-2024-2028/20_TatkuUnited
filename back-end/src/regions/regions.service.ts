import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Region, RegionDocument } from '../schema/region.schema';
import { Manager, ManagerDocument } from '../schema/manager.schema';
import { Provider, ProviderDocument } from '../schema/provider.schema';
import { ProviderStatus } from '../common/enums';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionsService {
  constructor(
    @InjectModel(Region.name)
    private readonly regionModel: Model<RegionDocument>,
    @InjectModel(Manager.name)
    private readonly managerModel: Model<ManagerDocument>,
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
  ) {}

  create(dto: CreateRegionDto) {
    return new this.regionModel(dto).save();
  }

  findAll() {
    return this.regionModel.find().populate('manager').exec();
  }

  /** Recomputes region centroid from mean coordinates of all approved providers (§4.2, §3.5) */
  async recomputeCentroid(regionId: string) {
    const region = Types.ObjectId.isValid(regionId)
      ? new Types.ObjectId(regionId)
      : regionId;
    const providers = await this.providerModel
      .find({ region, status: ProviderStatus.APPROVED })
      .exec();

    if (!providers || providers.length === 0) return null;

    let sumLng = 0;
    let sumLat = 0;
    let validCount = 0;
    for (const p of providers) {
      if (p.location && p.location.coordinates) {
        sumLng += p.location.coordinates[0];
        sumLat += p.location.coordinates[1];
        validCount++;
      }
    }

    if (validCount === 0) return null;

    const meanLng = sumLng / validCount;
    const meanLat = sumLat / validCount;

    return this.regionModel
      .findByIdAndUpdate(
        regionId,
        {
          location: {
            type: 'Point',
            coordinates: [meanLng, meanLat],
          },
        },
        { new: true },
      )
      .exec();
  }

  findActive() {
    return this.regionModel.find({ isActive: true }).exec();
  }

  async findByManager(managerId: string) {
    const manager = Types.ObjectId.isValid(managerId)
      ? new Types.ObjectId(managerId)
      : managerId;
    let regions = await this.regionModel
      .find({ manager })
      .populate('manager')
      .exec();

    if (!regions || regions.length === 0) {
      const managerDoc = await this.managerModel
        .findOne({ user: manager })
        .exec();
      if (managerDoc) {
        regions = await this.regionModel
          .find({ manager: managerDoc._id })
          .populate('manager')
          .exec();
      }
    }
    return regions;
  }

  async findOne(id: string) {
    const doc = await this.regionModel.findById(id).populate('manager').exec();
    if (!doc) throw new NotFoundException(`Region ${id} not found`);
    return doc;
  }

  async update(id: string, dto: UpdateRegionDto) {
    const doc = await this.regionModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException(`Region ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.regionModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Region ${id} not found`);
    return doc;
  }
}
