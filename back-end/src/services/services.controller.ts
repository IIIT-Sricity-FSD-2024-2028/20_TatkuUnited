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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new service offering',
    description:
      'Creates a service offering with pricing in paise, duration in minutes, what is covered/not covered, how it works, and FAQs.',
  })
  @ApiBody({ type: CreateServiceDto })
  @ApiResponse({ status: 201, description: 'Service successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid service payload.' })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all services',
    description: 'Retrieves all service offerings populated with category data.',
  })
  @ApiResponse({ status: 200, description: 'List of all services.' })
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get service by ID',
    description: 'Retrieves a single service offering by its Mongo ObjectId.',
  })
  @ApiParam({ name: 'id', description: 'Service Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Service found.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update service offering',
    description: 'Updates price, duration, descriptions, FAQs, or active availability.',
  })
  @ApiParam({ name: 'id', description: 'Service Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ type: UpdateServiceDto })
  @ApiResponse({ status: 200, description: 'Service updated successfully.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete service',
    description: 'Deletes a service offering from the catalog.',
  })
  @ApiParam({ name: 'id', description: 'Service Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Service successfully removed.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}

