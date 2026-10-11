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
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@ApiTags('Providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create / register a service provider profile',
    description:
      'Creates a new provider document linked to a User, specifying offered services, work hours, working days, and GeoJSON location.',
  })
  @ApiBody({ type: CreateProviderDto })
  @ApiResponse({ status: 201, description: 'Provider profile successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid provider data.' })
  create(@Body() createProviderDto: CreateProviderDto) {
    return this.providersService.create(createProviderDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all service providers',
    description: 'Retrieves all service providers with user relations, working days, and status.',
  })
  @ApiResponse({ status: 200, description: 'List of all providers.' })
  findAll() {
    return this.providersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get provider by ID',
    description: 'Retrieves a single service provider profile by Mongo ObjectId.',
  })
  @ApiParam({ name: 'id', description: 'Provider Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Provider found.' })
  @ApiResponse({ status: 404, description: 'Provider not found.' })
  findOne(@Param('id') id: string) {
    return this.providersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update provider profile',
    description: 'Updates provider fields such as status, offered services, work hours, or location.',
  })
  @ApiParam({ name: 'id', description: 'Provider Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ type: UpdateProviderDto })
  @ApiResponse({ status: 200, description: 'Provider updated successfully.' })
  @ApiResponse({ status: 404, description: 'Provider not found.' })
  update(
    @Param('id') id: string,
    @Body() updateProviderDto: UpdateProviderDto,
  ) {
    return this.providersService.update(id, updateProviderDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete provider',
    description: 'Removes a provider profile from the platform.',
  })
  @ApiParam({ name: 'id', description: 'Provider Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Provider successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Provider not found.' })
  remove(@Param('id') id: string) {
    return this.providersService.remove(id);
  }
}

