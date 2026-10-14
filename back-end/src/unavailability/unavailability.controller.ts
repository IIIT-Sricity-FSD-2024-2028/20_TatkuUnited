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
import { UnavailabilityService } from './unavailability.service';
import { CreateUnavailabilityDto } from './dto/create-unavailability.dto';
import { UpdateUnavailabilityDto } from './dto/update-unavailability.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';

@ApiTags('Unavailability')
@ApiBearerAuth('bearer-token')
@Controller('unavailability')
export class UnavailabilityController {
  constructor(private readonly unavailabilityService: UnavailabilityService) {}

  @Roles(Role.PROVIDER, Role.ADMIN)
  @Post()
  @ApiOperation({
    summary: 'Create blackout interval / provider unavailability',
    description:
      'Blocks out a provider schedule on a specific date between startTime and endTime (in minutes from midnight).',
  })
  @ApiBody({ type: CreateUnavailabilityDto })
  @ApiResponse({
    status: 201,
    description: 'Unavailability block successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid time bounds or missing fields.',
  })
  create(@Body() createUnavailabilityDto: CreateUnavailabilityDto) {
    return this.unavailabilityService.create(createUnavailabilityDto);
  }

  @Roles(Role.PROVIDER, Role.MANAGER, Role.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'Get all unavailability records',
    description:
      'Retrieves all blackout periods populated with provider profiles.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all unavailability records.',
  })
  findAll() {
    return this.unavailabilityService.findAll();
  }

  @Roles(Role.PROVIDER, Role.MANAGER, Role.ADMIN)
  @Get('provider/:providerId')
  @ApiOperation({
    summary: 'Get unavailability records by provider ID',
    description:
      'Retrieves all blackout periods / unavailabilities for a given provider (supports provider ObjectId or user ObjectId), optionally filtered by date.',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Provider Mongo ObjectId or User ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Optional date filter (YYYY-MM-DD)',
    example: '2026-10-15',
  })
  @ApiResponse({
    status: 200,
    description: 'List of unavailability records for the provider.',
  })
  findByProvider(
    @Param('providerId') providerId: string,
    @Query('date') date?: string,
  ) {
    return this.unavailabilityService.findByProvider(providerId, date);
  }

  @Roles(Role.PROVIDER, Role.MANAGER, Role.ADMIN)
  @Get(':id')
  @ApiOperation({
    summary: 'Get unavailability by ID',
    description:
      'Retrieves a single unavailability record by its Mongo ObjectId.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unavailability Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Unavailability record found.' })
  @ApiResponse({ status: 404, description: 'Unavailability record not found.' })
  findOne(@Param('id') id: string) {
    return this.unavailabilityService.findOne(id);
  }

  @Roles(Role.PROVIDER, Role.ADMIN)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update unavailability record',
    description:
      'Updates date, time slot bounds, or reason on an existing unavailability record.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unavailability Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiBody({ type: UpdateUnavailabilityDto })
  @ApiResponse({
    status: 200,
    description: 'Unavailability record updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Unavailability record not found.' })
  update(
    @Param('id') id: string,
    @Body() updateUnavailabilityDto: UpdateUnavailabilityDto,
  ) {
    return this.unavailabilityService.update(id, updateUnavailabilityDto);
  }

  @Roles(Role.PROVIDER, Role.ADMIN)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete unavailability record',
    description:
      'Deletes a blackout period, freeing the provider calendar slot.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unavailability Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({
    status: 200,
    description: 'Unavailability record removed successfully.',
  })
  @ApiResponse({ status: 404, description: 'Unavailability record not found.' })
  remove(@Param('id') id: string) {
    return this.unavailabilityService.remove(id);
  }
}
