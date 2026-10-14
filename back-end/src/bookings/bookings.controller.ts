import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { ProvidersService } from '../providers/providers.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('Bookings')
@ApiBearerAuth('bearer-token')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly providersService: ProvidersService,
  ) {}

  @Roles(Role.CUSTOMER, Role.ADMIN)

  @Post()
  @ApiOperation({
    summary: 'Create a new service booking',
    description:
      'Creates a booking reservation for a service with provider, customer, scheduledDate, startTime/endTime, travel buffers, and fee splits.',
  })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: 'Booking successfully created.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid booking data or slot conflict.',
  })
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Roles(Role.CUSTOMER, Role.PROVIDER, Role.MANAGER, Role.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'Get all bookings',
    description:
      'Retrieves all bookings with populated service, provider, customer, order, and region references.',
  })
  @ApiResponse({ status: 200, description: 'List of all bookings.' })
  findAll() {
    return this.bookingsService.findAll();
  }

  @Roles(Role.CUSTOMER, Role.PROVIDER, Role.MANAGER, Role.ADMIN)
  @Get('customer/:customerId')
  @ApiOperation({
    summary: 'Get bookings by customer ID',
    description:
      'Retrieves all bookings made by a specific customer, sorted by newest first.',
  })
  @ApiParam({
    name: 'customerId',
    description: 'Customer User Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'List of customer bookings.' })
  findByCustomer(@Param('customerId') customerId: string, @Req() req: any) {
    const user = req.user as AuthenticatedUser;
    if (user.role === Role.CUSTOMER && user.userId !== customerId) {
      throw new ForbiddenException(
        'Access denied. You can only view your own bookings',
      );
    }
    return this.bookingsService.findByCustomer(customerId);
  }

  @Roles(Role.CUSTOMER, Role.PROVIDER, Role.MANAGER, Role.ADMIN)
  @Get('provider/:providerId')
  @ApiOperation({
    summary: 'Get bookings by provider ID',
    description:
      'Retrieves all bookings scheduled for a specific provider, sorted chronologically.',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Provider Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'List of provider bookings.' })
  async findByProvider(@Param('providerId') providerId: string, @Req() req: any) {
    const user = req.user as AuthenticatedUser;
    if (user.role === Role.PROVIDER) {
      const providerDoc = await this.providersService.findByUser(user.userId);
      if (!providerDoc || providerDoc._id.toString() !== providerId) {
        throw new ForbiddenException(
          'Access denied. You can only view your own assigned bookings',
        );
      }
    }
    return this.bookingsService.findByProvider(providerId);
  }

  @Roles(Role.CUSTOMER, Role.PROVIDER, Role.MANAGER, Role.ADMIN)
  @Get('order/:orderId')
  @ApiOperation({
    summary: 'Get bookings by order ID',
    description:
      'Retrieves all booking items associated with a parent order transaction.',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Order Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'List of bookings for the order.' })
  async findByOrder(@Param('orderId') orderId: string, @Req() req: any) {
    const user = req.user as AuthenticatedUser;
    const bookings = await this.bookingsService.findByOrder(orderId);
    if (user.role === Role.CUSTOMER) {
      const hasForeign = bookings.some(
        (b) =>
          b.customer?.toString() !== user.userId &&
          (b.customer as any)?._id?.toString() !== user.userId,
      );
      if (hasForeign) {
        throw new ForbiddenException(
          'Access denied. You do not own the bookings for this order',
        );
      }
    }
    return bookings;
  }

  @Roles(Role.PROVIDER, Role.MANAGER, Role.ADMIN)
  @Get('provider/:providerId/offers')
  @ApiOperation({
    summary: 'Get pending job offers for provider inbox',
    description:
      'Retrieves all unaccepted job offers (awaiting_provider) whose offer timeout has not expired.',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Provider Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'List of active job offers.' })
  async findPendingOffers(
    @Param('providerId') providerId: string,
    @Req() req: any,
  ) {
    const user = req.user as AuthenticatedUser;
    if (user.role === Role.PROVIDER) {
      const providerDoc = await this.providersService.findByUser(user.userId);
      if (!providerDoc || providerDoc._id.toString() !== providerId) {
        throw new ForbiddenException(
          'Access denied. You can only view your own offers',
        );
      }
    }
    return this.bookingsService.findPendingOffersForProvider(providerId);
  }

  @Roles(Role.PROVIDER)
  @Get('provider-offers/me')
  @ApiOperation({
    summary: 'Get pending job offers for currently authenticated provider',
    description:
      'Retrieves all active unaccepted job offers for the authenticated provider derived strictly from JWT.',
  })
  @ApiResponse({ status: 200, description: 'List of active job offers.' })
  async findMyPendingOffers(@Req() req: any) {
    const user = req.user as AuthenticatedUser;
    const providerDoc = await this.providersService.findByUser(user.userId);
    if (!providerDoc) {
      throw new ForbiddenException('Provider profile not found');
    }
    return this.bookingsService.findPendingOffersForProvider(
      providerDoc._id.toString(),
    );
  }

  @Roles(Role.PROVIDER, Role.MANAGER, Role.ADMIN)
  @Get('provider/:providerId/schedule')
  @ApiOperation({
    summary: 'Get provider active job schedule',
    description:
      'Retrieves all confirmed and in-progress jobs assigned to the provider, optionally filtered by date.',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Provider Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Optional date filter (YYYY-MM-DD)',
    example: '2026-10-15',
  })
  @ApiResponse({ status: 200, description: 'List of scheduled jobs.' })
  async findSchedule(
    @Param('providerId') providerId: string,
    @Req() req: any,
    @Query('date') date?: string,
  ) {
    const user = req.user as AuthenticatedUser;
    if (user.role === Role.PROVIDER) {
      const providerDoc = await this.providersService.findByUser(user.userId);
      if (!providerDoc || providerDoc._id.toString() !== providerId) {
        throw new ForbiddenException(
          'Access denied. You can only view your own schedule',
        );
      }
    }
    return this.bookingsService.findScheduleForProvider(providerId, date);
  }


  @Roles(Role.MANAGER, Role.ADMIN)
  @Get('region/:regionId/problems')
  @ApiOperation({
    summary: 'Get problem bookings in region',
    description:
      'Retrieves bookings in region that were cancelled by providers or the system (e.g. no provider available).',
  })
  @ApiParam({
    name: 'regionId',
    description: 'Region Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'List of problem bookings.' })
  findProblems(@Param('regionId') regionId: string) {
    return this.bookingsService.findProblemBookingsByRegion(regionId);
  }

  @Roles(Role.MANAGER, Role.ADMIN)
  @Get('region/:regionId')
  @ApiOperation({
    summary: 'Get bookings by region ID',
    description:
      'Retrieves all bookings in a specific operational region, optionally filtered by date.',
  })
  @ApiParam({
    name: 'regionId',
    description: 'Region Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Optional date filter (YYYY-MM-DD)',
    example: '2026-10-15',
  })
  @ApiResponse({ status: 200, description: 'List of bookings in the region.' })
  findByRegion(
    @Param('regionId') regionId: string,
    @Query('date') date?: string,
  ) {
    return this.bookingsService.findByRegion(regionId, date);
  }

  @Roles(Role.CUSTOMER, Role.PROVIDER, Role.MANAGER, Role.ADMIN)
  @Get(':id')
  @ApiOperation({
    summary: 'Get booking by ID',
    description: 'Retrieves a single booking details by its Mongo ObjectId.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Booking found.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const user = req.user as AuthenticatedUser;
    const booking: any = await this.bookingsService.findOne(id);
    if (user.role === Role.CUSTOMER) {
      const customerId =
        booking.customer?._id?.toString() || booking.customer?.toString();
      if (customerId !== user.userId) {
        throw new ForbiddenException(
          'Access denied. You can only view your own booking',
        );
      }
    } else if (user.role === Role.PROVIDER) {
      const providerDoc = await this.providersService.findByUser(user.userId);
      const bookingProviderId =
        booking.provider?._id?.toString() || booking.provider?.toString();
      if (!providerDoc || bookingProviderId !== providerDoc._id.toString()) {
        throw new ForbiddenException(
          'Access denied. You can only view your own assigned booking',
        );
      }
    }
    return booking;
  }

  @Roles(Role.PROVIDER, Role.ADMIN)
  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Provider accepts booking offer',
    description:
      'Accepts an awaiting_provider booking before the offer timeout expires, transitioning it to confirmed. Identity taken strictly from JWT.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Booking accepted.' })
  @ApiResponse({ status: 409, description: 'This job was already taken.' })
  acceptOffer(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.bookingsService.acceptOffer(id, user);
  }

  @Roles(Role.PROVIDER, Role.ADMIN)
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Provider declines booking offer',
    description:
      'Declines an offer and adds the provider to declinedBy list to trigger reassignment. Identity taken strictly from JWT.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Booking offer declined.' })
  rejectOffer(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.bookingsService.rejectOffer(id, user);
  }


  @Roles(Role.PROVIDER, Role.MANAGER, Role.ADMIN)
  @Post(':id/start')
  @ApiOperation({
    summary: 'Start job',
    description:
      'Transitions confirmed booking to in_progress when the provider arrives and begins service.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Job started.' })
  startJob(@Param('id') id: string) {
    return this.bookingsService.startJob(id);
  }

  @Roles(Role.PROVIDER, Role.MANAGER, Role.ADMIN)
  @Post(':id/complete')
  @ApiOperation({
    summary: 'Complete job',
    description:
      'Transitions in_progress booking to completed when service is fully rendered.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Job completed.' })
  completeJob(@Param('id') id: string) {
    return this.bookingsService.completeJob(id);
  }

  @Roles(Role.CUSTOMER, Role.PROVIDER, Role.MANAGER, Role.ADMIN)
  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel booking',
    description:
      'Cancels a booking with reason and actor (customer, provider, manager, admin).',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['cancelledBy'],
      properties: {
        cancelledBy: {
          type: 'string',
          enum: ['customer', 'provider', 'manager', 'admin', 'system'],
        },
        reason: { type: 'string', example: 'Customer requested reschedule' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Booking cancelled.' })
  cancelBooking(
    @Param('id') id: string,
    @Body('cancelledBy') cancelledBy: any,
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.cancelBooking(id, cancelledBy, reason);
  }

  @Roles(Role.CUSTOMER, Role.PROVIDER, Role.MANAGER, Role.ADMIN)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update booking status or details',
    description:
      'Updates booking state (e.g. confirmed, in_progress, completed, cancelled), OTP, or notes.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiBody({ type: UpdateBookingDto })
  @ApiResponse({ status: 200, description: 'Booking successfully updated.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete booking',
    description: 'Removes a booking record from the platform.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Booking successfully removed.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }
}
