import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags, ApiHeader } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('bookings')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // Specific routes MUST come before :id

  @Post('checkout')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Checkout — create booking from cart' })
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })
  @ApiResponse({ status: 201, description: 'Booking created from cart items' })
  @ApiResponse({ status: 400, description: 'Cart empty or not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — customer only' })
  checkout(@Request() req) {
    return this.bookingsService.checkout(req.user.sub);
  }

  @Get('my')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Get my bookings (JWT customer)' })
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })
  @ApiResponse({ status: 200, description: 'Customer bookings returned' })
  @ApiResponse({ status: 403, description: 'Forbidden — customer only' })
  getMyBookings(@Request() req) {
    return this.bookingsService.findByCustomer(req.user.sub);
  }

  @Get('customer/:customerId')
  @Roles(Role.CUSTOMER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Get bookings by customer ID' })
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })
  @ApiResponse({ status: 200, description: 'Customer bookings returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByCustomer(@Param('customerId') customerId: string) {
    return this.bookingsService.findByCustomer(customerId);
  }

  @Get('sector/:sectorId')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get bookings by sector ID' })
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })
  @ApiResponse({ status: 200, description: 'Sector bookings returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findBySector(@Param('sectorId') sectorId: string) {
    return this.bookingsService.findBySector(sectorId);
  }

  @Get()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })
  @ApiResponse({ status: 200, description: 'All bookings returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER, Role.SERVICE_PROVIDER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get booking by ID (with services)' })
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })
  @ApiResponse({ status: 200, description: 'Booking with services returned' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/cancel')
  @Roles(Role.CUSTOMER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  @ApiResponse({ status: 400, description: 'Booking already cancelled' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(id);
  }
}
