import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JobAssignmentsService } from './job-assignments.service';
import { CompleteJobDto } from './dto/complete-job.dto';
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
    private readonly jaService: JobAssignmentsService,
    private readonly accessScope: AccessScopeService,
  ) {}

  // Specific routes MUST come before :id

  @Post('assign/:bookingId')
  @Roles(Role.SUPER_USER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Auto-assign providers to a booking' })
  @ApiResponse({ status: 201, description: 'Providers assigned' })
  @ApiResponse({ status: 400, description: 'No qualified provider found' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  autoAssign(
    @Param('bookingId') bookingId: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.UNIT_MANAGER) {
      const booking = this.jaService.findBooking(bookingId);
      this.accessScope.assertSectorAccess(req.user, booking.sector_id);
    }
    return this.jaService.autoAssign(bookingId);
  }

  @Get('booking/:bookingId')
  @Roles(
    Role.SUPER_USER,
    Role.COLLECTIVE_MANAGER,
    Role.UNIT_MANAGER,
    Role.SERVICE_PROVIDER,
    Role.CUSTOMER,
  )
  @ApiOperation({ summary: 'Get assignments for a booking' })
  @ApiResponse({ status: 200, description: 'Assignments for the booking' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByBooking(
    @Param('bookingId') bookingId: string,
    @Request() req: { user: JwtPayload },
  ) {
    const rows = this.jaService.findByBooking(bookingId);
    if (req.user.role === Role.SERVICE_PROVIDER) {
      return rows.filter((row) => row.sp_id === req.user.sub);
    }
    if (req.user.role === Role.CUSTOMER) {
      const booking = this.jaService.findBooking(bookingId);
      if (booking.customer_id !== req.user.sub) {
        throw new ForbiddenException('Customers can only access their own booking assignments');
      }
    }
    if (req.user.role === Role.COLLECTIVE_MANAGER || req.user.role === Role.UNIT_MANAGER) {
      const booking = this.jaService.findBooking(bookingId);
      this.accessScope.assertSectorAccess(req.user, booking.sector_id);
    }
    return rows;
  }

  @Get('provider/:spId')
  @Roles(Role.SERVICE_PROVIDER, Role.UNIT_MANAGER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Get assignments for a provider' })
  @ApiResponse({ status: 200, description: 'Assignments for the provider' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByProvider(
    @Param('spId') spId: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.SERVICE_PROVIDER && req.user.sub !== spId) {
      throw new ForbiddenException('Providers can only access their own assignments');
    }
    if (req.user.role === Role.UNIT_MANAGER) {
      this.accessScope.assertProviderAccess(req.user, spId);
    }
    return this.jaService.findByProvider(spId);
  }

  @Patch(':id/complete')
  @Roles(Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Mark assignment as complete (triggers revenue split when all done)' })
  @ApiResponse({ status: 200, description: 'Assignment marked complete' })
  @ApiResponse({ status: 400, description: 'Already completed' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - service_provider only' })
  markComplete(
    @Param('id') id: string,
    @Body() dto: CompleteJobDto,
    @Request() req: { user: JwtPayload },
  ) {
    const assignment = this.jaService.findOne(id);
    if (assignment.sp_id !== req.user.sub) {
      throw new ForbiddenException('Providers can only complete their own assignments');
    }
    return this.jaService.markComplete(id, dto);
  }

  @Patch(':id/in-progress')
  @Roles(Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Mark assignment as in-progress' })
  @ApiResponse({ status: 200, description: 'Assignment marked in-progress' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - service_provider only' })
  markInProgress(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    const assignment = this.jaService.findOne(id);
    if (assignment.sp_id !== req.user.sub) {
      throw new ForbiddenException('Providers can only update their own assignments');
    }
    return this.jaService.markInProgress(id);
  }

  @Get()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get all job assignments (scoped for managers)' })
  @ApiResponse({ status: 200, description: 'All assignments returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.COLLECTIVE_MANAGER) {
      const manager = this.accessScope.getCollectiveManager(req.user.sub);
      return this.jaService.findAll().filter((assignment) => {
        const provider = this.accessScope.getProvider(assignment.sp_id);
        const unit = this.accessScope.getUnit(provider.unit_id);
        return unit.collective_id === manager.collective_id;
      });
    }
    if (req.user.role === Role.UNIT_MANAGER) {
      const manager = this.accessScope.getUnitManager(req.user.sub);
      return this.jaService.findAll().filter((assignment) => {
        const provider = this.accessScope.getProvider(assignment.sp_id);
        return provider.unit_id === manager.unit_id;
      });
    }
    return this.jaService.findAll();
  }

  @Get(':id')
  @Roles(
    Role.SUPER_USER,
    Role.COLLECTIVE_MANAGER,
    Role.UNIT_MANAGER,
    Role.SERVICE_PROVIDER,
    Role.CUSTOMER,
  )
  @ApiOperation({ summary: 'Get assignment by ID' })
  @ApiResponse({ status: 200, description: 'Assignment returned' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    const assignment = this.jaService.findOne(id);
    if (req.user.role === Role.SERVICE_PROVIDER && assignment.sp_id !== req.user.sub) {
      throw new ForbiddenException('Providers can only access their own assignments');
    }
    if (req.user.role === Role.CUSTOMER) {
      const booking = this.jaService.findBooking(assignment.booking_id);
      if (booking.customer_id !== req.user.sub) {
        throw new ForbiddenException('Customers can only access their own booking assignments');
      }
    }
    if (req.user.role === Role.COLLECTIVE_MANAGER || req.user.role === Role.UNIT_MANAGER) {
      const booking = this.jaService.findBooking(assignment.booking_id);
      this.accessScope.assertSectorAccess(req.user, booking.sector_id);
    }
    return assignment;
  }
}
