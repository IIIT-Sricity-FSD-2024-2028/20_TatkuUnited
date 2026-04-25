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
import { SectorsService } from './sectors.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('sectors')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sectors')
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) { }

  @Get()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Get all sectors' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.sectorsService.findAll();
  }

  @Get('collective/:collectiveId')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Get sectors by collective ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByCollective(@Param('collectiveId') collectiveId: string) {
    return this.sectorsService.findByCollective(collectiveId);
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Get sector by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string) {
    return this.sectorsService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Create a new sector' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateSectorDto) {
    return this.sectorsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Update a sector' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(@Param('id') id: string, @Body() dto: UpdateSectorDto) {
    return this.sectorsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Delete a sector' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.sectorsService.remove(id);
  }
}
