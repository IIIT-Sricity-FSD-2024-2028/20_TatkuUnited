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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';

@ApiTags('Regions')
@ApiBearerAuth('bearer-token')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Roles(Role.ADMIN)
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

  @Roles(Role.MANAGER, Role.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'Get all regions',
    description: 'Retrieves all operational regions. Restricted to regional managers and admins.',
  })
  @ApiResponse({ status: 200, description: 'List of all regions.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires manager or admin role.' })
  findAll() {
    return this.regionsService.findAll();
  }

  @Roles(Role.MANAGER, Role.ADMIN)
  @Get('manager/:managerId')
  @ApiOperation({
    summary: 'Get regions controlled by manager ID',
    description:
      'Retrieves all operational regions assigned to a specific manager (supports manager ObjectId or user ObjectId). Restricted to regional managers and admins.',
  })
  @ApiParam({
    name: 'managerId',
    description: 'Manager Mongo ObjectId or User ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'List of regions controlled by manager.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires manager or admin role.' })
  findByManager(@Param('managerId') managerId: string) {
    return this.regionsService.findByManager(managerId);
  }

  @Roles(Role.MANAGER, Role.ADMIN)
  @Get(':id')
  @ApiOperation({
    summary: 'Get region by ID',
    description: 'Retrieves a single region document by Mongo ObjectId. Restricted to regional managers and admins.',
  })
  @ApiParam({ name: 'id', description: 'Region Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Region found.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires manager or admin role.' })
  @ApiResponse({ status: 404, description: 'Region not found.' })
  findOne(@Param('id') id: string) {
    return this.regionsService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
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

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post(':id/recompute-centroid')
  @ApiOperation({
    summary: 'Recompute region centroid',
    description: 'Calculates the mean coordinates of all approved providers in this region and updates the centroid (§4.2, §3.5).',
  })
  @ApiParam({ name: 'id', description: 'Region Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Region centroid recomputed.' })
  recomputeCentroid(@Param('id') id: string) {
    return this.regionsService.recomputeCentroid(id);
  }

  @Roles(Role.ADMIN)
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

