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
import { UnavailabilityService } from './unavailability.service';
import { CreateUnavailabilityDto } from './dto/create-unavailability.dto';
import { UpdateUnavailabilityDto } from './dto/update-unavailability.dto';

@ApiTags('Unavailability')
@Controller('unavailability')
export class UnavailabilityController {
  constructor(private readonly unavailabilityService: UnavailabilityService) {}

  @Post()
  @ApiOperation({
    summary: 'Create blackout interval / provider unavailability',
    description:
      'Blocks out a provider schedule on a specific date between startTime and endTime (in minutes from midnight).',
  })
  @ApiBody({ type: CreateUnavailabilityDto })
  @ApiResponse({ status: 201, description: 'Unavailability block successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid time bounds or missing fields.' })
  create(@Body() createUnavailabilityDto: CreateUnavailabilityDto) {
    return this.unavailabilityService.create(createUnavailabilityDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all unavailability records',
    description: 'Retrieves all blackout periods populated with provider profiles.',
  })
  @ApiResponse({ status: 200, description: 'List of all unavailability records.' })
  findAll() {
    return this.unavailabilityService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get unavailability by ID',
    description: 'Retrieves a single unavailability record by its Mongo ObjectId.',
  })
  @ApiParam({ name: 'id', description: 'Unavailability Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Unavailability record found.' })
  @ApiResponse({ status: 404, description: 'Unavailability record not found.' })
  findOne(@Param('id') id: string) {
    return this.unavailabilityService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update unavailability record',
    description: 'Updates date, time slot bounds, or reason on an existing unavailability record.',
  })
  @ApiParam({ name: 'id', description: 'Unavailability Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ type: UpdateUnavailabilityDto })
  @ApiResponse({ status: 200, description: 'Unavailability record updated successfully.' })
  @ApiResponse({ status: 404, description: 'Unavailability record not found.' })
  update(
    @Param('id') id: string,
    @Body() updateUnavailabilityDto: UpdateUnavailabilityDto,
  ) {
    return this.unavailabilityService.update(id, updateUnavailabilityDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete unavailability record',
    description: 'Deletes a blackout period, freeing the provider calendar slot.',
  })
  @ApiParam({ name: 'id', description: 'Unavailability Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Unavailability record removed successfully.' })
  @ApiResponse({ status: 404, description: 'Unavailability record not found.' })
  remove(@Param('id') id: string) {
    return this.unavailabilityService.remove(id);
  }
}

