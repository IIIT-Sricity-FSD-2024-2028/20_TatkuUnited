import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';
import { CreatePlatformSettingDto } from './dto/create-platform-setting.dto';
import { UpdatePlatformSettingDto } from './dto/update-platform-setting.dto';

@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(private readonly platformSettingsService: PlatformSettingsService) {}

  @Post()
  create(@Body() createPlatformSettingDto: CreatePlatformSettingDto) {
    return this.platformSettingsService.create(createPlatformSettingDto);
  }

  @Get()
  findAll() {
    return this.platformSettingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.platformSettingsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlatformSettingDto: UpdatePlatformSettingDto) {
    return this.platformSettingsService.update(+id, updatePlatformSettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.platformSettingsService.remove(+id);
  }
}
