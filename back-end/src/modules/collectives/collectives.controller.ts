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
import { CollectivesService } from './collectives.service';
import { CreateCollectiveDto } from './dto/create-collective.dto';
import { UpdateCollectiveDto } from './dto/update-collective.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AccessScopeService } from '../../common/access/access-scope.service';
import { ApiRoleHeader } from '../../common/decorators/api-role-header.decorator';

@ApiTags('collectives')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('collectives')
export class CollectivesController {
  constructor(
    private readonly collectivesService: CollectivesService,
    private readonly accessScope: AccessScopeService,
  ) {}

  @Get()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiOperation({ summary: 'List all collectives' })
  @ApiResponse({ status: 200, description: 'Returns all collectives' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.COLLECTIVE_MANAGER) {
      const manager = this.accessScope.getCollectiveManager(req.user.sub);
      return [this.collectivesService.findOne(manager.collective_id)];
    }
    return this.collectivesService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiOperation({ summary: 'Get a collective by ID' })
  @ApiResponse({ status: 200, description: 'Returns the collective' })
  @ApiResponse({ status: 404, description: 'Collective not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    this.accessScope.assertCollectiveAccess(req.user, id);
    return this.collectivesService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Create a new collective' })
  @ApiResponse({ status: 201, description: 'Collective created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateCollectiveDto) {
    return this.collectivesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiOperation({ summary: 'Update a collective' })
  @ApiResponse({ status: 200, description: 'Collective updated' })
  @ApiResponse({ status: 404, description: 'Collective not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCollectiveDto,
    @Request() req: { user: JwtPayload },
  ) {
    this.accessScope.assertCollectiveAccess(req.user, id);
    if (
      req.user.role === Role.COLLECTIVE_MANAGER &&
      dto.collective_name === undefined &&
      dto.is_active === undefined
    ) {
      throw new ForbiddenException('No permitted collective fields supplied');
    }
    return this.collectivesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete a collective' })
  @ApiResponse({ status: 200, description: 'Collective deleted' })
  @ApiResponse({ status: 404, description: 'Collective not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.collectivesService.remove(id);
  }
}
