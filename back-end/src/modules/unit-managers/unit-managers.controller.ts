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
import { UnitManagersService } from './unit-managers.service';
import { CreateUnitManagerDto } from './dto/create-unit-manager.dto';
import { UpdateUnitManagerDto } from './dto/update-unit-manager.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AccessScopeService } from '../../common/access/access-scope.service';
import { ApiRoleHeader } from '../../common/decorators/api-role-header.decorator';

@ApiTags('unit-managers')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('unit-managers')
export class UnitManagersController {
  constructor(
    private readonly unitManagersService: UnitManagersService,
    private readonly accessScope: AccessScopeService,
  ) {}

  @Get()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiOperation({ summary: 'Get all unit managers' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.COLLECTIVE_MANAGER) {
      const manager = this.accessScope.getCollectiveManager(req.user.sub);
      return this.unitManagersService.findAll().filter((um) => {
        if (!um.unit_id) return true;
        try {
          const unit = this.accessScope.getUnit(um.unit_id);
          return unit.collective_id === manager.collective_id;
        } catch (e) {
          return false;
        }
      });
    }
    return this.unitManagersService.findAll();

  }

  @Get('unit/:unit_id')
  @Roles(Role.SUPER_USER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get unit managers by unit ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByUnit(
    @Param('unit_id') unitId: string,
    @Request() req: { user: JwtPayload },
  ) {
    this.accessScope.assertUnitAccess(req.user, unitId);
    return this.unitManagersService.findByUnit(unitId);
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get unit manager by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    const manager = this.unitManagersService.findOne(id);
    if (req.user.role === Role.UNIT_MANAGER && req.user.sub !== id) {
      throw new ForbiddenException('Unit managers can only access their own account');
    }
    this.accessScope.assertUnitAccess(req.user, manager.unit_id);
    return manager;
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Create a new unit manager' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateUnitManagerDto) {
    return this.unitManagersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER, Role.UNIT_MANAGER, Role.COLLECTIVE_MANAGER)
  @ApiOperation({ summary: 'Update a unit manager' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUnitManagerDto,
    @Request() req: { user: JwtPayload },
  ) {
    const manager = this.unitManagersService.findOne(id);
    if (req.user.role === Role.UNIT_MANAGER && req.user.sub !== id) {
      throw new ForbiddenException('Unit managers can only update their own account');
    }
    if (req.user.role !== Role.COLLECTIVE_MANAGER) {
      this.accessScope.assertUnitAccess(req.user, manager.unit_id);
    }
    if (dto.unit_id !== undefined && req.user.role !== Role.COLLECTIVE_MANAGER) {
      this.accessScope.assertUnitAccess(req.user, dto.unit_id);
    }
    return this.unitManagersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete a unit manager' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.unitManagersService.remove(id);
  }
}
