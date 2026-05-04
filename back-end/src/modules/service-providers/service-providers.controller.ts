import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ServiceProvidersService } from './service-providers.service';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AccessScopeService } from '../../common/access/access-scope.service';
import { ApiRoleHeader } from '../../common/decorators/api-role-header.decorator';

@ApiTags('service-providers')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('service-providers')
export class ServiceProvidersController {
  constructor(
    private readonly serviceProvidersService: ServiceProvidersService,
    private readonly accessScope: AccessScopeService,
  ) {}

  @Get()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get all service providers (scoped for managers)' })
  @ApiResponse({ status: 200, description: 'Success - returns list of providers' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.COLLECTIVE_MANAGER) {
      const manager = this.accessScope.getCollectiveManager(req.user.sub);
      return this.serviceProvidersService.findAll().filter((sp) => {
        if (!sp.unit_id) {
          if (!sp.home_sector_id) return false;
          try {
            const sector = this.accessScope.getSector(sp.home_sector_id);
            return sector.collective_id === manager.collective_id;
          } catch {
            return false;
          }
        }
        const unit = this.accessScope.getUnit(sp.unit_id);
        return unit.collective_id === manager.collective_id;
      });
    }
    if (req.user.role === Role.UNIT_MANAGER) {
      const manager = this.accessScope.getUnitManager(req.user.sub);
      return this.serviceProvidersService.findByUnit(manager.unit_id);
    }
    return this.serviceProvidersService.findAll();

  }

  @Get('unit/:unit_id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get service providers by unit ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByUnit(
    @Param('unit_id') unitId: string,
    @Request() req: { user: JwtPayload },
  ) {
    this.accessScope.assertUnitAccess(req.user, unitId);
    return this.serviceProvidersService.findByUnit(unitId);
  }

  @Get('sector/:sector_id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get service providers by sector ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findBySector(
    @Param('sector_id') sectorId: string,
    @Request() req: { user: JwtPayload },
  ) {
    this.accessScope.assertSectorAccess(req.user, sectorId);
    return this.serviceProvidersService.findBySector(sectorId);
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER, Role.UNIT_MANAGER, Role.COLLECTIVE_MANAGER)
  @ApiOperation({ summary: 'Get service provider by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.SERVICE_PROVIDER && req.user.sub !== id) {
      throw new ForbiddenException('Providers can only access their own account');
    }
    if (req.user.role === Role.UNIT_MANAGER || req.user.role === Role.COLLECTIVE_MANAGER) {
      this.accessScope.assertProviderAccess(req.user, id);
    }
    return this.serviceProvidersService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Create a new service provider' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateServiceProviderDto, @Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.COLLECTIVE_MANAGER) {
      this.accessScope.assertUnitAccess(req.user, dto.unit_id);
      this.accessScope.assertSectorAccess(req.user, dto.sector_id);
    }
    this.accessScope.assertUnitAndSectorCompatible(dto.unit_id, dto.sector_id);
    return this.serviceProvidersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER, Role.UNIT_MANAGER, Role.COLLECTIVE_MANAGER)
  @ApiOperation({ summary: 'Update a service provider' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceProviderDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.SERVICE_PROVIDER && req.user.sub !== id) {
      throw new ForbiddenException('Providers can only update their own account');
    }
    if (req.user.role === Role.UNIT_MANAGER || req.user.role === Role.COLLECTIVE_MANAGER) {
      this.accessScope.assertProviderAccess(req.user, id);
    }
    if (dto.unit_id !== undefined || dto.sector_id !== undefined) {
      const provider = this.serviceProvidersService.findOne(id);
      const nextUnitId = dto.unit_id ?? provider.unit_id;
      const nextSectorId = dto.sector_id ?? provider.home_sector_id;
      this.accessScope.assertUnitAndSectorCompatible(nextUnitId, nextSectorId);
      if (req.user.role === Role.UNIT_MANAGER || req.user.role === Role.COLLECTIVE_MANAGER) {
        this.accessScope.assertUnitAccess(req.user, nextUnitId);
        this.accessScope.assertSectorAccess(req.user, nextSectorId);
      }
    }
    return this.serviceProvidersService.update(id, dto);
  }

  @Patch('working-hours/:id')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Update working hours of service provider' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updateWorkingHours(
    @Param('id') id: string,
    @Body() dto: UpdateWorkingHoursDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.SERVICE_PROVIDER && req.user.sub !== id) {
      throw new ForbiddenException('Providers can only update their own working hours');
    }
    return this.serviceProvidersService.updateWorkingHours(id, dto);
  }

  @Patch('profile/:id')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Update profile of service provider' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProviderProfileDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.SERVICE_PROVIDER && req.user.sub !== id) {
      throw new ForbiddenException('Providers can only update their own profile');
    }
    return this.serviceProvidersService.updateProfile(id, dto);
  }

  @Patch('deactivate/:id')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Request deactivation of service provider' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  requestDeactivation(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.SERVICE_PROVIDER && req.user.sub !== id) {
      throw new ForbiddenException('Providers can only request their own deactivation');
    }
    return this.serviceProvidersService.requestDeactivation(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Delete a service provider' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.COLLECTIVE_MANAGER || req.user.role === Role.UNIT_MANAGER) {
      this.accessScope.assertProviderAccess(req.user, id);
    }
    return this.serviceProvidersService.remove(id);
  }
}
