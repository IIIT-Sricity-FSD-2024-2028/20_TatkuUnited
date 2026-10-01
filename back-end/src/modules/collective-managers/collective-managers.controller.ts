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
import { CollectiveManagersService } from './collective-managers.service';
import { CreateCollectiveManagerDto } from './dto/create-collective-manager.dto';
import { UpdateCollectiveManagerDto } from './dto/update-collective-manager.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AccessScopeService } from '../../common/access/access-scope.service';
import { ApiRoleHeader } from '../../common/decorators/api-role-header.decorator';

@ApiTags('collective-managers')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('collective-managers')
export class CollectiveManagersController {
  constructor(
    private readonly collectiveManagersService: CollectiveManagersService,
    private readonly accessScope: AccessScopeService,
  ) {}

  @Get()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiOperation({ summary: 'Get all collective managers' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.COLLECTIVE_MANAGER) {
      const manager = this.accessScope.getCollectiveManager(req.user.sub);
      return this.collectiveManagersService
        .findAll()
        .filter((cm) => cm.collective_id === manager.collective_id);
    }
    return this.collectiveManagersService.findAll();

  }

  @Get('collective/:collective_id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiOperation({ summary: 'Get collective managers by collective ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByCollective(
    @Param('collective_id') collectiveId: string,
    @Request() req: { user: JwtPayload },
  ) {
    this.accessScope.assertCollectiveAccess(req.user, collectiveId);
    return this.collectiveManagersService.findByCollective(collectiveId);
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiOperation({ summary: 'Get collective manager by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    const manager = this.collectiveManagersService.findOne(id);
    if (req.user.role === Role.COLLECTIVE_MANAGER && req.user.sub !== id) {
      throw new ForbiddenException('Collective managers can only access their own account');
    }
    this.accessScope.assertCollectiveAccess(req.user, manager.collective_id);
    return this.collectiveManagersService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Create a new collective manager' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateCollectiveManagerDto) {
    return this.collectiveManagersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiOperation({ summary: 'Update a collective manager' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCollectiveManagerDto,
    @Request() req: { user: JwtPayload },
  ) {
    const manager = this.collectiveManagersService.findOne(id);
    if (req.user.role === Role.COLLECTIVE_MANAGER && req.user.sub !== id) {
      throw new ForbiddenException('Collective managers can only update their own account');
    }
    this.accessScope.assertCollectiveAccess(req.user, manager.collective_id);
    if (dto.collective_id !== undefined) {
      this.accessScope.assertCollectiveAccess(req.user, dto.collective_id);
    }
    return this.collectiveManagersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete a collective manager' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.collectiveManagersService.remove(id);
  }
}
