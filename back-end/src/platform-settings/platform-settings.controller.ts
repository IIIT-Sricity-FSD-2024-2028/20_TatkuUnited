import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PlatformSettingsService } from './platform-settings.service';
import { CreatePlatformSettingDto } from './dto/create-platform-setting.dto';
import { UpdatePlatformSettingDto } from './dto/update-platform-setting.dto';

@ApiTags('Platform Settings')
@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create global platform settings',
    description:
      'Creates system-wide configuration including commission percentage, max assignment distance, slot intervals, lead times, and timeouts.',
  })
  @ApiBody({ type: CreatePlatformSettingDto })
  @ApiResponse({ status: 201, description: 'Platform settings created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid setting parameters.' })
  create(@Body() createPlatformSettingDto: CreatePlatformSettingDto) {
    return this.platformSettingsService.create(createPlatformSettingDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all platform settings',
    description: 'Retrieves all configuration entries for platform policies and scheduling constraints.',
  })
  @ApiResponse({ status: 200, description: 'List of platform settings.' })
  findAll() {
    return this.platformSettingsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get platform setting by ID',
    description: 'Retrieves a specific configuration document by Mongo ObjectId.',
  })
  @ApiParam({ name: 'id', description: 'Setting Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Platform setting found.' })
  @ApiResponse({ status: 404, description: 'Platform setting not found.' })
  findOne(@Param('id') id: string) {
    return this.platformSettingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update platform setting',
    description: 'Updates commission fee percent, slot interval, buffer times, or offer timeout limits.',
  })
  @ApiParam({ name: 'id', description: 'Setting Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ type: UpdatePlatformSettingDto })
  @ApiResponse({ status: 200, description: 'Platform setting updated successfully.' })
  @ApiResponse({ status: 404, description: 'Platform setting not found.' })
  update(
    @Param('id') id: string,
    @Body() updatePlatformSettingDto: UpdatePlatformSettingDto,
  ) {
    return this.platformSettingsService.update(id, updatePlatformSettingDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete platform setting',
    description: 'Removes a setting configuration document.',
  })
  @ApiParam({ name: 'id', description: 'Setting Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Platform setting removed successfully.' })
  @ApiResponse({ status: 404, description: 'Platform setting not found.' })
  remove(@Param('id') id: string) {
    return this.platformSettingsService.remove(id);
  }
}

