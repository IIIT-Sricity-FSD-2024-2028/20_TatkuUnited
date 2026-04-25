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
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('provider-unavailability')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('provider-unavailability')
export class ProviderUnavailabilityController {
  constructor(private readonly providerUnavailabilityService: ProviderUnavailabilityService) {}

  @Get()
  @Roles(Role.SUPER_USER, Role.UNIT_MANAGER, Role.COLLECTIVE_MANAGER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Get all provider unavailabilities' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.providerUnavailabilityService.findAll();
  }

  @Get('provider/:provider_id')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER, Role.UNIT_MANAGER, Role.COLLECTIVE_MANAGER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Get provider unavailabilities by provider ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByProvider(
    @Param('provider_id') providerId: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.SERVICE_PROVIDER && req.user.sub !== providerId) {
      throw new ForbiddenException('Providers can only access their own unavailability');
    }
    return this.providerUnavailabilityService.findByProvider(providerId);
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER, Role.UNIT_MANAGER, Role.COLLECTIVE_MANAGER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Get provider unavailability by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    const record = this.providerUnavailabilityService.findOne(id);
    if (req.user.role === Role.SERVICE_PROVIDER && req.user.sub !== record.sp_id) {
      throw new ForbiddenException('Providers can only access their own unavailability');
    }
    return record;
  }

  @Post()
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Create a new provider unavailability' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body() dto: CreateProviderUnavailabilityDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.SERVICE_PROVIDER && req.user.sub !== dto.provider_id) {
      throw new ForbiddenException('Providers can only create their own unavailability');
    }
    return this.providerUnavailabilityService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Update a provider unavailability' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProviderUnavailabilityDto,
    @Request() req: { user: JwtPayload },
  ) {
    const record = this.providerUnavailabilityService.findOne(id);
    if (req.user.role === Role.SERVICE_PROVIDER && req.user.sub !== record.sp_id) {
      throw new ForbiddenException('Providers can only update their own unavailability');
    }
    return this.providerUnavailabilityService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Delete a provider unavailability' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    const record = this.providerUnavailabilityService.findOne(id);
    if (req.user.role === Role.SERVICE_PROVIDER && req.user.sub !== record.sp_id) {
      throw new ForbiddenException('Providers can only delete their own unavailability');
    }
    return this.providerUnavailabilityService.remove(id);
  }
}
