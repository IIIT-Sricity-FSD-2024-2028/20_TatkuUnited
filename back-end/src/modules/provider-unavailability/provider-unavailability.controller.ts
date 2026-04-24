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
import { ProviderUnavailabilityService } from './provider-unavailability.service';
import { CreateProviderUnavailabilityDto } from './dto/create-provider-unavailability.dto';
import { UpdateProviderUnavailabilityDto } from './dto/update-provider-unavailability.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('provider-unavailability')
@ApiBearerAuth('bearer')
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('provider-unavailability')
export class ProviderUnavailabilityController {
  constructor(private readonly providerUnavailabilityService: ProviderUnavailabilityService) {}

  @Get()
  // @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Get all provider unavailabilities' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.providerUnavailabilityService.findAll();
  }

  @Get('provider/:provider_id')
  // @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Get provider unavailabilities by provider ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByProvider(@Param('provider_id') providerId: string) {
    return this.providerUnavailabilityService.findByProvider(providerId);
  }

  @Get(':id')
  // @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Get provider unavailability by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string) {
    return this.providerUnavailabilityService.findOne(id);
  }

  @Post()
  // @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Create a new provider unavailability' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateProviderUnavailabilityDto) {
    return this.providerUnavailabilityService.create(dto);
  }

  @Patch(':id')
  // @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Update a provider unavailability' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(@Param('id') id: string, @Body() dto: UpdateProviderUnavailabilityDto) {
    return this.providerUnavailabilityService.update(id, dto);
  }

  @Delete(':id')
  // @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Delete a provider unavailability' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.providerUnavailabilityService.remove(id);
  }
}
