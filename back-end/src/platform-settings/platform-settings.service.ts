import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PlatformSetting,
  PlatformSettingDocument,
} from '../schema/platform-setting.schema';
import { CreatePlatformSettingDto } from './dto/create-platform-setting.dto';
import { UpdatePlatformSettingDto } from './dto/update-platform-setting.dto';

/**
 * PlatformSettingsService — manages the single global settings document.
 * Use upsert() to initialise; use get() everywhere else.
 */
@Injectable()
export class PlatformSettingsService {
  constructor(
    @InjectModel(PlatformSetting.name)
    private readonly settingModel: Model<PlatformSettingDocument>,
  ) {}

  /** Create the singleton settings document (admin, done once). */
  create(dto: CreatePlatformSettingDto) {
    return new this.settingModel(dto).save();
  }

  /** Returns the single settings document. Used on every checkout and slot listing. */
  async get() {
    let doc = await this.settingModel.findOne().exec();
    if (!doc) {
      doc = await new this.settingModel({
        platformFeePercent: 15,
        maxAssignmentDistanceKm: 10,
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
    } else {
      let modified = false;
      if (doc.offerTimeoutMinutes !== 5) {
        doc.offerTimeoutMinutes = 5;
        modified = true;
      }
      if (doc.maxOfferRounds === undefined || doc.maxOfferRounds === null) {
        doc.maxOfferRounds = 3;
        modified = true;
      }
      if (doc.offerBatchSize === undefined || doc.offerBatchSize === null) {
        doc.offerBatchSize = 5;
        modified = true;
      }
      if (doc.payoutHoldHours === undefined || doc.payoutHoldHours === null) {
        doc.payoutHoldHours = 0;
        modified = true;
      }
      if (!doc.matchWeights || !doc.matchWeights.distance) {
        doc.matchWeights = { distance: 0.4, rating: 0.4, availability: 0.2 } as any;
        modified = true;
      }
      if (modified) {
        await doc.save();
      }
    }
    return doc;
  }

  /** Alias for controllers that expect findAll. */
  async findAll() {
    const doc = await this.get();
    return [doc];
  }

  async findOne(id: string) {
    const doc = await this.settingModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Platform settings not found');
    return doc;
  }

  /** Update the single settings document. Changes only affect future bookings. */
  async update(id: string, dto: UpdatePlatformSettingDto) {
    const doc = await this.settingModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException('Platform settings not found');
    return doc;
  }

  async remove(id: string) {
    const doc = await this.settingModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('Platform settings not found');
    return doc;
  }
}
