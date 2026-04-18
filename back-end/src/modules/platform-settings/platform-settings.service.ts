import { Injectable } from '@nestjs/common';
import { CreatePlatformSettingDto } from './dto/create-platform-setting.dto';
import { UpdatePlatformSettingDto } from './dto/update-platform-setting.dto';

@Injectable()
export class PlatformSettingsService {
  create(createPlatformSettingDto: CreatePlatformSettingDto) {
    return 'This action adds a new platformSetting';
  }

  findAll() {
    return `This action returns all platformSettings`;
  }

  findOne(id: number) {
    return `This action returns a #${id} platformSetting`;
  }

  update(id: number, updatePlatformSettingDto: UpdatePlatformSettingDto) {
    return `This action updates a #${id} platformSetting`;
  }

  remove(id: number) {
    return `This action removes a #${id} platformSetting`;
  }
}
