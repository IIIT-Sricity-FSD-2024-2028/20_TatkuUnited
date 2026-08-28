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

  @Get()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({ status: 200, description: 'All bookings returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Request() req: { user: JwtPayload }) {
    return this.bookingsService.findAll();
  }

  @Get(':id')
  @Roles(
    Role.SUPER_USER,
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
