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
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@ApiTags('Regions')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new region',
    description: 'Registers a serviceable geographical region assigned to a regional manager with centroid coordinates.',
  })
  @ApiBody({ type: CreateRegionDto })
  @ApiResponse({ status: 201, description: 'Region successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid region payload.' })
  create(@Body() createRegionDto: CreateRegionDto) {
    return this.regionsService.create(createRegionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all regions',
    description: 'Retrieves all operational regions with their assigned manager and centroid locations.',
  })
  @ApiResponse({ status: 200, description: 'List of all regions.' })
  findAll() {
    return this.regionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get region by ID',
    description: 'Retrieves a single region document by Mongo ObjectId.',
  })
  @ApiParam({ name: 'id', description: 'Region Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Region found.' })
  @ApiResponse({ status: 404, description: 'Region not found.' })
  findOne(@Param('id') id: string) {
    return this.regionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update region',
    description: 'Updates region properties, such as assigned manager, centroid GeoLocation, or active state.',
  })
  @ApiParam({ name: 'id', description: 'Region Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ type: UpdateRegionDto })
  @ApiResponse({ status: 200, description: 'Region successfully updated.' })
  @ApiResponse({ status: 404, description: 'Region not found.' })
  update(@Param('id') id: string, @Body() updateRegionDto: UpdateRegionDto) {
    return this.regionsService.update(id, updateRegionDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete region',
    description: 'Removes a region from the platform.',
  })
  @ApiParam({ name: 'id', description: 'Region Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Region successfully removed.' })
  @ApiResponse({ status: 404, description: 'Region not found.' })
  remove(@Param('id') id: string) {
    return this.regionsService.remove(id);
  }
}

