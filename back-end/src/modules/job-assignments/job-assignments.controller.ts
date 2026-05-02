import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags, ApiHeader } from '@nestjs/swagger';
import { JobAssignmentsService } from './job-assignments.service';
import { CompleteJobDto } from './dto/complete-job.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('job-assignments')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('job-assignments')
export class JobAssignmentsController {
  constructor(private readonly jaService: JobAssignmentsService) {}

  // Specific routes MUST come before :id

  @Post('assign/:bookingId')
  @Roles(Role.SUPER_USER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Auto-assign providers to a booking' })
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })
  @ApiResponse({ status: 201, description: 'Providers assigned' })
  @ApiResponse({ status: 400, description: 'No qualified provider found' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  autoAssign(@Param('bookingId') bookingId: string) {
    return this.jaService.autoAssign(bookingId);
  }

  @Get('booking/:bookingId')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER, Role.SERVICE_PROVIDER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get assignments for a booking' })
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })
  @ApiResponse({ status: 200, description: 'Assignments for the booking' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.jaService.findByBooking(bookingId);
  }

  @Get('provider/:spId')
  @Roles(Role.SERVICE_PROVIDER, Role.UNIT_MANAGER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Get assignments for a provider' })
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })
  @ApiResponse({ status: 200, description: 'Assignments for the provider' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByProvider(@Param('spId') spId: string) {
    return this.jaService.findByProvider(spId);
  }

  @Patch(':id/complete')
  @Roles(Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Mark assignment as complete (triggers revenue split when all done)' })
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })
  @ApiResponse({ status: 200, description: 'Assignment marked complete' })
  @ApiResponse({ status: 400, description: 'Already completed' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — service_provider only' })
  markComplete(@Param('id') id: string, @Body() dto: CompleteJobDto) {
    return this.jaService.markComplete(id, dto);
  }

  @Get()
  @Roles(Role.SUPER_USER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get all job assignments' })
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })
  @ApiResponse({ status: 200, description: 'All assignments returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.jaService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER, Role.SERVICE_PROVIDER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get assignment by ID' })
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })
  @ApiResponse({ status: 200, description: 'Assignment returned' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string) {
    return this.jaService.findOne(id);
  }
}
