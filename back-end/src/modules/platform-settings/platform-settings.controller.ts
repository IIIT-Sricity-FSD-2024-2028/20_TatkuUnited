import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PlatformSettingsService } from './platform-settings.service';
import { CreatePlatformSettingDto } from './dto/create-platform-setting.dto';
import { UpdatePlatformSettingDto } from './dto/update-platform-setting.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import {
  ApiActorIdHeader,
  ApiRoleHeader,
} from '../../common/decorators/api-role-header.decorator';

@ApiTags('Platform Settings')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@ApiActorIdHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  // ─────────────────────────────── POST / ──────────────────────────────────

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Create a new platform setting' })
  @ApiBody({ type: CreatePlatformSettingDto })
  @ApiResponse({ status: 201, description: 'Setting created' })
  @ApiResponse({ status: 403, description: 'Forbidden — super_user only' })
  @ApiResponse({ status: 409, description: 'Key already exists (ConflictException)' })
  create(@Body() dto: CreatePlatformSettingDto) {
    return this.platformSettingsService.create(dto);
  }

  // ─────────────────────────────── GET / ───────────────────────────────────

  @Get()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'List all platform settings' })
  @ApiResponse({ status: 200, description: 'Array of all settings' })
  @ApiResponse({ status: 403, description: 'Forbidden — super_user only' })
  findAll() {
    return this.platformSettingsService.findAll();
  }

  // ────────────────────────── GET /:keyOrId ────────────────────────────────
  // Available to ALL roles.  Whitelist enforcement happens inside the service.

  @Get(':keyOrId')
  @ApiOperation({ summary: 'Get one setting by UUID or key string' })
  @ApiParam({ name: 'keyOrId', description: 'setting_id (UUID) or key string' })
  @ApiResponse({ status: 200, description: 'Setting found' })
  @ApiResponse({ status: 403, description: 'Key not whitelisted for this role' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('keyOrId') keyOrId: string, @Req() req: any) {
    const callerRole = (req.headers['x-role'] as Role) ?? Role.CUSTOMER;
    return this.platformSettingsService.getPublicSetting(keyOrId, callerRole);
  }

  // ────────────────────────── PUT /:key ────────────────────────────────────

  @Put(':key')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Upsert a setting by key — super_user only' })
  @ApiParam({ name: 'key', description: 'Setting key string' })
  @ApiBody({ type: UpdatePlatformSettingDto })
  @ApiResponse({ status: 200, description: 'Setting updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('key') key: string,
    @Body() dto: UpdatePlatformSettingDto,
  ) {
    // Merge the route param key into the DTO so the upsert targets the right row.
    const merged = { ...dto, key };
    // Try to find by key first; if found use its ID for update, otherwise create.
    const existing = this.platformSettingsService['repo'].findByKey(key);
    if (existing) {
      return this.platformSettingsService.update(existing.setting_id, merged);
    }
    // Key does not exist — create via upsert path
    return this.platformSettingsService.create({
      key,
      value: dto.value ?? '',
      description: dto.description,
      updated_by: dto.updated_by ?? '',
    });
  }

  // ────────────────────────── DELETE /:id ──────────────────────────────────

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete a setting by UUID — super_user only' })
  @ApiParam({ name: 'id', description: 'setting_id UUID' })
  @ApiResponse({ status: 200, description: 'Setting deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string) {
    return this.platformSettingsService.remove(id);
  }
}
