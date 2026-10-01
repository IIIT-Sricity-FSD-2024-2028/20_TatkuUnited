import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AccessScopeService } from '../../common/access/access-scope.service';
import { ApiRoleHeader } from '../../common/decorators/api-role-header.decorator';

@ApiTags('sectors')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sectors')
export class SectorsController {
  constructor(
    private readonly sectorsService: SectorsService,
    private readonly accessScope: AccessScopeService,
  ) {}

  @Get()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get all sectors' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.COLLECTIVE_MANAGER) {
      const manager = this.accessScope.getCollectiveManager(req.user.sub);
      return this.sectorsService.findByCollective(manager.collective_id);
    }
    if (req.user.role === Role.UNIT_MANAGER) {
      const manager = this.accessScope.getUnitManager(req.user.sub);
      const unit = this.accessScope.getUnit(manager.unit_id);
      return this.sectorsService.findByCollective(unit.collective_id);
    }
    return this.sectorsService.findAll();
  }

  @Get('collective/:collectiveId')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get sectors by collective ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByCollective(
    @Param('collectiveId') collectiveId: string,
    @Request() req: { user: JwtPayload },
  ) {
    this.accessScope.assertCollectiveAccess(req.user, collectiveId);
    return this.sectorsService.findByCollective(collectiveId);
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get sector by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    this.accessScope.assertSectorAccess(req.user, id);
    return this.sectorsService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Create a new sector' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateSectorDto) {
    return this.sectorsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiOperation({ summary: 'Update a sector' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSectorDto,
    @Request() req: { user: JwtPayload },
  ) {
    this.accessScope.assertSectorAccess(req.user, id);
    if (dto.collective_id !== undefined) {
      this.accessScope.assertCollectiveAccess(req.user, dto.collective_id);
    }
    return this.sectorsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete a sector' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.sectorsService.remove(id);
  }
}
