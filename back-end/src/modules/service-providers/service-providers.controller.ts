import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
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

@ApiTags('service-providers')
@ApiBearerAuth('bearer')
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('service-providers')
export class ServiceProvidersController {
  constructor(private readonly serviceProvidersService: ServiceProvidersService) {}

  @Get()
  // @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Get all service providers' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.serviceProvidersService.findAll();
  }

  @Get('unit/:unit_id')
  // @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Get service providers by unit ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByUnit(@Param('unit_id') unitId: string) {
    return this.serviceProvidersService.findByUnit(unitId);
  }

  @Get('sector/:sector_id')
  // @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Get service providers by sector ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findBySector(@Param('sector_id') sectorId: string) {
    return this.serviceProvidersService.findBySector(sectorId);
  }

  @Get(':id')
  // @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Get service provider by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string) {
    return this.serviceProvidersService.findOne(id);
  }

  @Post()
  // @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Create a new service provider' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateServiceProviderDto) {
    return this.serviceProvidersService.create(dto);
  }

  @Patch(':id')
  // @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Update a service provider' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceProviderDto) {
    return this.serviceProvidersService.update(id, dto);
  }

  @Patch('working-hours/:id')
  // @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Update working hours of service provider' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updateWorkingHours(@Param('id') id: string, @Body() dto: UpdateWorkingHoursDto) {
    return this.serviceProvidersService.updateWorkingHours(id, dto);
  }

  @Patch('profile/:id')
  // @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Update profile of service provider' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updateProfile(@Param('id') id: string, @Body() dto: UpdateProviderProfileDto) {
    return this.serviceProvidersService.updateProfile(id, dto);
  }

  @Patch('deactivate/:id')
  // @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Request deactivation of service provider' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  requestDeactivation(@Param('id') id: string) {
    return this.serviceProvidersService.requestDeactivation(id);
  }

  @Delete(':id')
  // @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Delete a service provider' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.serviceProvidersService.remove(id);
  }
}
