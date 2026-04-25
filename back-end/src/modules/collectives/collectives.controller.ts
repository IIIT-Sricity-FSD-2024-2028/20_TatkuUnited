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
import { CollectivesService } from './collectives.service';
import { CreateCollectiveDto } from './dto/create-collective.dto';
import { UpdateCollectiveDto } from './dto/update-collective.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('collectives')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('collectives')
export class CollectivesController {
  constructor(private readonly collectivesService: CollectivesService) { }

  @Get()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiHeader({ name: 'Authorization', description: 'Bearer token', required: true })
  @ApiOperation({ summary: 'List all collectives' })
  @ApiResponse({ status: 200, description: 'Returns all collectives' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.collectivesService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiHeader({ name: 'Authorization', description: 'Bearer token', required: true })
  @ApiOperation({ summary: 'Get a collective by ID' })
  @ApiResponse({ status: 200, description: 'Returns the collective' })
  @ApiResponse({ status: 404, description: 'Collective not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string) {
    return this.collectivesService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiHeader({ name: 'Authorization', description: 'Bearer token', required: true })
  @ApiOperation({ summary: 'Create a new collective' })
  @ApiResponse({ status: 201, description: 'Collective created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateCollectiveDto) {
    return this.collectivesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiHeader({ name: 'Authorization', description: 'Bearer token', required: true })
  @ApiOperation({ summary: 'Update a collective' })
  @ApiResponse({ status: 200, description: 'Collective updated' })
  @ApiResponse({ status: 404, description: 'Collective not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(@Param('id') id: string, @Body() dto: UpdateCollectiveDto) {
    return this.collectivesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiHeader({ name: 'Authorization', description: 'Bearer token', required: true })
  @ApiOperation({ summary: 'Delete a collective' })
  @ApiResponse({ status: 200, description: 'Collective deleted' })
  @ApiResponse({ status: 404, description: 'Collective not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.collectivesService.remove(id);
  }
}
