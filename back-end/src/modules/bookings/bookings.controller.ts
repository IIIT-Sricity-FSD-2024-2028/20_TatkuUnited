import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CheckoutBookingDto } from './dto/checkout-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AccessScopeService } from '../../common/access/access-scope.service';
import { ApiRoleHeader } from '../../common/decorators/api-role-header.decorator';

@ApiTags('bookings')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly accessScope: AccessScopeService,
  ) {}

  @Post('checkout')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Checkout cart and create booking' })
  @ApiResponse({ status: 201, description: 'Booking created' })
  checkout(
    @Request() req: { user: JwtPayload },
    @Body() dto: CheckoutBookingDto,
  ) {
    return this.bookingsService.checkout(req.user.sub, dto);
  }

  @Get('my')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Get current customer bookings' })
  @ApiResponse({ status: 200, description: 'List of customer bookings' })
  findMyBookings(@Request() req: { user: JwtPayload }) {
    return this.bookingsService.findByCustomer(req.user.sub);
  }

  @Get('provider/:providerId')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Get bookings assigned to a service provider' })
  findByProvider(
    @Param('providerId') providerId: string,
    @Request() req: { user: JwtPayload },
  ) {
    this.accessScope.assertProviderAccess(req.user, providerId);
    return this.bookingsService.findByProvider(providerId);
  }

  @Get()
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({ status: 200, description: 'All bookings returned' })
  findAll(@Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.REGION_MANAGER) {
      const manager = this.accessScope.getRegionManager(req.user.sub);
      const providerIds = this.bookingsService
        .findByProviderAssignmentsForRegion(manager.region_id)
        .map((provider) => provider.sp_id);
      return this.bookingsService.findAll().filter((booking) =>
        this.bookingsService
          .findAssignmentsByBooking(booking.booking_id)
          .some((assignment) => providerIds.includes(assignment.sp_id)),
      );
    }
    return this.bookingsService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER, Role.CUSTOMER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Get booking details by ID' })
  findOne(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    const booking = this.bookingsService.findOne(id);
    if (req.user.role === Role.CUSTOMER && booking.customer_id !== req.user.sub) {
      /* customer own check */
    }
    return booking;
  }

  @Patch(':id/cancel')
  @Roles(Role.SUPER_USER, Role.CUSTOMER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Cancel booking' })
  cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(id);
  }
}
