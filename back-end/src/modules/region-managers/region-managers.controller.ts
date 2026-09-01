import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegionManagersService } from './region-managers.service';
import { CreateRegionManagerDto } from './dto/create-region-manager.dto';
import { UpdateRegionManagerDto } from './dto/update-region-manager.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ApiRoleHeader } from '../../common/decorators/api-role-header.decorator';

@ApiTags('region-managers')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('region-managers')
export class RegionManagersController {
  constructor(private readonly service: RegionManagersService) {}

  @Get()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Get all region managers' })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Get region manager by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    return this.service.findOneScoped(id, req.user);
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Create region manager' })
  @ApiResponse({ status: 201, description: 'Created' })
  create(@Body() dto: CreateRegionManagerDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Update region manager' })
  @ApiResponse({ status: 200, description: 'Updated' })
  update(@Param('id') id: string, @Body() dto: UpdateRegionManagerDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete region manager' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
