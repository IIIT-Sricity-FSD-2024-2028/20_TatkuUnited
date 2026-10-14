import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';
import { ProviderStatus } from '../common/enums';

@ApiTags('Providers')
@ApiBearerAuth('bearer-token')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Roles(Role.ADMIN, Role.PROVIDER)
  @Post()
  @ApiOperation({
    summary: 'Create / register a service provider profile',
    description:
      'Creates a new provider document linked to a User, specifying offered services, work hours, working days, and GeoJSON location.',
  })
  @ApiBody({ type: CreateProviderDto })
  @ApiResponse({
    status: 201,
    description: 'Provider profile successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Invalid provider data.' })
  create(@Body() createProviderDto: CreateProviderDto) {
    return this.providersService.create(createProviderDto);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Get()
  @ApiOperation({
    summary: 'Get all service providers',
    description:
      'Retrieves all service providers with user relations, working days, and status.',
  })
  @ApiResponse({ status: 200, description: 'List of all providers.' })
  findAll() {
    return this.providersService.findAll();
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.PROVIDER)
  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get provider profile by user ID',
    description:
      'Retrieves a service provider profile linked to a specific user account.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Provider found.' })
  @ApiResponse({ status: 404, description: 'Provider not found.' })
  findByUser(@Param('userId') userId: string) {
    return this.providersService.findByUser(userId);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Get('region/:regionId')
  @ApiOperation({
    summary: 'Get providers by region ID',
    description:
      'Retrieves all service providers assigned to a specific geographical region, optionally filtered by status (e.g. pending, approved, suspended).',
  })
  @ApiParam({
    name: 'regionId',
    description: 'Region Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Provider status filter',
    enum: ['pending', 'approved', 'suspended'],
  })
  @ApiResponse({ status: 200, description: 'List of providers in region.' })
  findByRegion(
    @Param('regionId') regionId: string,
    @Query('status') status?: string,
  ) {
    return this.providersService.findByRegion(regionId, status);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Get('status/:status')
  @ApiOperation({
    summary: 'Get providers by status',
    description:
      'Retrieves all providers with a specific status (pending, approved, suspended).',
  })
  @ApiParam({
    name: 'status',
    description: 'Provider status',
    example: 'pending',
  })
  @ApiResponse({ status: 200, description: 'List of providers with status.' })
  findByStatus(@Param('status') status: string) {
    return this.providersService.findByStatus(status);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.PROVIDER, Role.CUSTOMER)
  @Get('service/:serviceId')
  @ApiOperation({
    summary: 'Get providers offering a specific service',
    description:
      'Retrieves all active service providers offering the requested service.',
  })
  @ApiParam({
    name: 'serviceId',
    description: 'Service Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({
    status: 200,
    description: 'List of providers offering the service.',
  })
  findByService(@Param('serviceId') serviceId: string) {
    return this.providersService.findByService(serviceId);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve provider application',
    description:
      'Updates provider status to approved, enabling them to receive job offers (§4.2, §4.16).',
  })
  @ApiParam({
    name: 'id',
    description: 'Provider Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Provider approved.' })
  approve(@Param('id') id: string) {
    return this.providersService.update(id, {
      status: ProviderStatus.APPROVED,
    });
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id/suspend')
  @ApiOperation({
    summary: 'Suspend provider',
    description:
      'Suspends provider account, preventing them from receiving future job offers (§4.16).',
  })
  @ApiParam({
    name: 'id',
    description: 'Provider Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Provider suspended.' })
  suspend(@Param('id') id: string) {
    return this.providersService.update(id, {
      status: ProviderStatus.SUSPENDED,
    });
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.PROVIDER)
  @Get(':id')
  @ApiOperation({
    summary: 'Get provider by ID',
    description:
      'Retrieves a single service provider profile by Mongo ObjectId.',
  })
  @ApiParam({
    name: 'id',
    description: 'Provider Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Provider found.' })
  @ApiResponse({ status: 404, description: 'Provider not found.' })
  findOne(@Param('id') id: string) {
    return this.providersService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.PROVIDER)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update provider profile',
    description:
      'Updates provider fields such as status, offered services, work hours, or location.',
  })
  @ApiParam({
    name: 'id',
    description: 'Provider Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiBody({ type: UpdateProviderDto })
  @ApiResponse({ status: 200, description: 'Provider updated successfully.' })
  @ApiResponse({ status: 404, description: 'Provider not found.' })
  update(
    @Param('id') id: string,
    @Body() updateProviderDto: UpdateProviderDto,
  ) {
    return this.providersService.update(id, updateProviderDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete provider',
    description: 'Removes a provider profile from the platform.',
  })
  @ApiParam({
    name: 'id',
    description: 'Provider Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Provider successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Provider not found.' })
  remove(@Param('id') id: string) {
    return this.providersService.remove(id);
  }
}
