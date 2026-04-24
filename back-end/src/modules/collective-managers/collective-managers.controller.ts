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
import { CollectiveManagersService } from './collective-managers.service';
import { CreateCollectiveManagerDto } from './dto/create-collective-manager.dto';
import { UpdateCollectiveManagerDto } from './dto/update-collective-manager.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('collective-managers')
@ApiBearerAuth('bearer')
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('collective-managers')
export class CollectiveManagersController {
  constructor(private readonly collectiveManagersService: CollectiveManagersService) {}

  @Get()
  // @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Get all collective managers' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.collectiveManagersService.findAll();
  }

  @Get('collective/:collective_id')
  // @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Get collective managers by collective ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByCollective(@Param('collective_id') collectiveId: string) {
    return this.collectiveManagersService.findByCollective(collectiveId);
  }

  @Get(':id')
  // @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Get collective manager by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string) {
    return this.collectiveManagersService.findOne(id);
  }

  @Post()
  // @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Create a new collective manager' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateCollectiveManagerDto) {
    return this.collectiveManagersService.create(dto);
  }

  @Patch(':id')
  // @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Update a collective manager' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(@Param('id') id: string, @Body() dto: UpdateCollectiveManagerDto) {
    return this.collectiveManagersService.update(id, dto);
  }

  @Delete(':id')
  // @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Delete a collective manager' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.collectiveManagersService.remove(id);
  }
}
