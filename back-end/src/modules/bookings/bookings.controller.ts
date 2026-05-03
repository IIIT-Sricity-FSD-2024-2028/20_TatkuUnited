import {
  Controller,
  Body,
  ForbiddenException,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AccessScopeService } from '../../common/access/access-scope.service';
import { ApiRoleHeader } from '../../common/decorators/api-role-header.decorator';
import { CheckoutBookingDto } from './dto/checkout-booking.dto';

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

  // Specific routes MUST come before :id

  @Post('checkout')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Checkout - create booking from cart' })
  @ApiResponse({ status: 201, description: 'Booking created from cart items' })
  @ApiResponse({ status: 400, description: 'Cart empty or not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - customer only' })
  checkout(@Request() req, @Body() dto: CheckoutBookingDto = {}) {
    return this.bookingsService.checkout(req.user.sub, dto);
  }

  @Get('my')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Get my bookings (JWT customer)' })
  @ApiResponse({ status: 200, description: 'Customer bookings returned' })
  @ApiResponse({ status: 403, description: 'Forbidden - customer only' })
  getMyBookings(@Request() req) {
    return this.bookingsService.findByCustomer(req.user.sub);
  }

  @Get('customer/:customerId')
  @Roles(Role.CUSTOMER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Get bookings by customer ID' })
  @ApiResponse({ status: 200, description: 'Customer bookings returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByCustomer(
    @Param('customerId') customerId: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.CUSTOMER && req.user.sub !== customerId) {
      throw new ForbiddenException('Customers can only access their own bookings');
    }
    return this.bookingsService.findByCustomer(customerId);
  }

  @Get('sector/:sectorId')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get bookings by sector ID' })
  @ApiResponse({ status: 200, description: 'Sector bookings returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findBySector(
    @Param('sectorId') sectorId: string,
    @Request() req: { user: JwtPayload },
  ) {
    this.accessScope.assertSectorAccess(req.user, sectorId);
    return this.bookingsService.findBySector(sectorId);
  }

  @Get()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({ status: 200, description: 'All bookings returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.COLLECTIVE_MANAGER) {
      const manager = this.accessScope.getCollectiveManager(req.user.sub);
      return this.bookingsService.findAll().filter((booking) => {
        const sector = this.accessScope.getSector(booking.sector_id);
        return sector.collective_id === manager.collective_id;
      });
    }
    if (req.user.role === Role.UNIT_MANAGER) {
      const manager = this.accessScope.getUnitManager(req.user.sub);
      const providerIds = this.bookingsService
        .findByProviderAssignmentsForUnit(manager.unit_id)
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
  @Roles(
    Role.SUPER_USER,
    Role.COLLECTIVE_MANAGER,
    Role.UNIT_MANAGER,
    Role.SERVICE_PROVIDER,
    Role.CUSTOMER,
  )
  @ApiOperation({ summary: 'Get booking by ID (with services)' })
  @ApiResponse({ status: 200, description: 'Booking with services returned' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    const booking = this.bookingsService.findOne(id);
    if (req.user.role === Role.CUSTOMER && booking.customer_id !== req.user.sub) {
      throw new ForbiddenException('Customers can only access their own bookings');
    }
    if (req.user.role === Role.SERVICE_PROVIDER) {
      const providerBookingIds = this.bookingsService
        .findByProvider(req.user.sub)
        .map((row) => row.booking_id);
      if (!providerBookingIds.includes(id)) {
        throw new ForbiddenException('Providers can only access their assigned bookings');
      }
    }
    if (req.user.role === Role.COLLECTIVE_MANAGER || req.user.role === Role.UNIT_MANAGER) {
      this.accessScope.assertSectorAccess(req.user, booking.sector_id);
    }
    return booking;
  }

  @Patch(':id/cancel')
  @Roles(Role.CUSTOMER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  @ApiResponse({ status: 400, description: 'Booking already cancelled' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  cancel(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.CUSTOMER) {
      const booking = this.bookingsService.findOne(id);
      if (booking.customer_id !== req.user.sub) {
        throw new ForbiddenException('Customers can only cancel their own bookings');
      }
    }
    return this.bookingsService.cancel(id);
  }
}
