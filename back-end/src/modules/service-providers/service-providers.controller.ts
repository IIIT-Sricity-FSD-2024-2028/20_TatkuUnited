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
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Get service providers (scoped for region managers)' })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll(@Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.REGION_MANAGER) {
      const manager = this.accessScope.getRegionManager(req.user.sub);
      const all = this.serviceProvidersService.findAll();
      // Return assigned providers to region OR pending/unassigned providers
      return all.filter((sp) => sp.region_id === manager.region_id || !sp.region_id || sp.account_status === 'pending');
    }
    return this.serviceProvidersService.findAll();
  }

  @Get('pending')
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Get all pending unapproved service providers' })
  @ApiResponse({ status: 200, description: 'Success' })
  findPending() {
    return this.serviceProvidersService.findPending();
  }

  @Get('region/:region_id')
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Get service providers by region ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  findByRegion(
    @Param('region_id') regionId: string,
    @Request() req: { user: JwtPayload },
  ) {
    this.accessScope.assertRegionAccess(req.user, regionId);
    return this.serviceProvidersService.findByRegion(regionId);
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Get service provider by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    this.accessScope.assertProviderAccess(req.user, id);
    return this.serviceProvidersService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Create service provider' })
  @ApiResponse({ status: 201, description: 'Created' })
  create(@Body() dto: CreateServiceProviderDto) {
    return this.serviceProvidersService.create(dto);
  }

  @Patch(':id/approve')
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Approve provider and assign to region' })
  @ApiResponse({ status: 200, description: 'Approved' })
  approve(
    @Param('id') id: string,
    @Body('region_id') regionId: string,
    @Request() req: { user: JwtPayload },
  ) {
    let targetRegionId = regionId;
    if (req.user.role === Role.REGION_MANAGER) {
      const manager = this.accessScope.getRegionManager(req.user.sub);
      targetRegionId = manager.region_id;
    }
    return this.serviceProvidersService.approve(id, targetRegionId);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Update service provider' })
  @ApiResponse({ status: 200, description: 'Updated' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceProviderDto,
    @Request() req: { user: JwtPayload },
  ) {
    this.accessScope.assertProviderAccess(req.user, id);
    return this.serviceProvidersService.update(id, dto);
  }

  @Patch(':id/working-hours')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Update working hours' })
  @ApiResponse({ status: 200, description: 'Updated' })
  updateWorkingHours(
    @Param('id') id: string,
    @Body() dto: UpdateWorkingHoursDto,
    @Request() req: { user: JwtPayload },
  ) {
    this.accessScope.assertProviderAccess(req.user, id);
    return this.serviceProvidersService.updateWorkingHours(id, dto);
  }

  @Patch(':id/profile')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Update provider profile' })
  @ApiResponse({ status: 200, description: 'Updated' })
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProviderProfileDto,
    @Request() req: { user: JwtPayload },
  ) {
    this.accessScope.assertProviderAccess(req.user, id);
    return this.serviceProvidersService.updateProfile(id, dto);
  }

  @Patch(':id/request-deactivation')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Request account deactivation' })
  @ApiResponse({ status: 200, description: 'Updated' })
  requestDeactivation(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    this.accessScope.assertProviderAccess(req.user, id);
    return this.serviceProvidersService.requestDeactivation(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete service provider' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  remove(@Param('id') id: string) {
    return this.serviceProvidersService.remove(id);
  }
}
