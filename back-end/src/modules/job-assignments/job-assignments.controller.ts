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
import { JobAssignmentsService } from './job-assignments.service';
import { CreateJobAssignmentDto } from './dto/create-job-assignment.dto';
import { UpdateJobAssignmentDto } from './dto/update-job-assignment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AccessScopeService } from '../../common/access/access-scope.service';
import { ApiRoleHeader } from '../../common/decorators/api-role-header.decorator';

@ApiTags('job-assignments')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('job-assignments')
export class JobAssignmentsController {
  constructor(
    private readonly service: JobAssignmentsService,
    private readonly accessScope: AccessScopeService,
  ) {}

  @Get()
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Get all job assignments' })
  findAll(@Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.REGION_MANAGER) {
      const manager = this.accessScope.getRegionManager(req.user.sub);
      const all = this.service.findAll();
      return all.filter((ja) => {
        try {
          const sp = this.accessScope.getProvider(ja.sp_id);
          return sp.region_id === manager.region_id;
        } catch {
          return false;
        }
      });
    }
    return this.service.findAll();
  }

  @Get('provider/:sp_id')
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Get job assignments by provider' })
  findByProvider(@Param('sp_id') spId: string, @Request() req: { user: JwtPayload }) {
    this.accessScope.assertProviderAccess(req.user, spId);
    return this.service.findByProvider(spId);
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Get job assignment by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Create job assignment' })
  create(@Body() dto: CreateJobAssignmentDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Update job assignment' })
  update(@Param('id') id: string, @Body() dto: UpdateJobAssignmentDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Update job assignment status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('assignment_score') score?: number,
  ) {
    return this.service.updateStatus(id, status, score);
  }

  @Patch(':id/in-progress')
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Mark job assignment as in progress' })
  markInProgress(@Param('id') id: string) {
    return this.service.markInProgress(id);
  }

  @Patch(':id/complete')
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Mark job assignment as completed' })
  markComplete(@Param('id') id: string, @Body() dto: any) {
    return this.service.markComplete(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete job assignment' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
