import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlatformSetting, PlatformSettingDocument } from '../schema/platform-setting.schema';
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
    const doc = await this.settingModel.findOne().exec();
    if (!doc) throw new NotFoundException('Platform settings have not been initialised');
    return doc;
  }

  /** Alias for controllers that expect findAll. */
  findAll() {
    return this.settingModel.find().exec();
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
