import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new service booking',
    description:
      'Creates a booking reservation for a service with provider, customer, scheduledDate, startTime/endTime, travel buffers, and fee splits.',
  })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: 'Booking successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid booking data or slot conflict.' })
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all bookings',
    description: 'Retrieves all bookings with populated service, provider, customer, order, and region references.',
  })
  @ApiResponse({ status: 200, description: 'List of all bookings.' })
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get booking by ID',
    description: 'Retrieves a single booking details by its Mongo ObjectId.',
  })
  @ApiParam({ name: 'id', description: 'Booking Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Booking found.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update booking status or details',
    description: 'Updates booking state (e.g. confirmed, in_progress, completed, cancelled), OTP, or notes.',
  })
  @ApiParam({ name: 'id', description: 'Booking Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ type: UpdateBookingDto })
  @ApiResponse({ status: 200, description: 'Booking successfully updated.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete booking',
    description: 'Removes a booking record from the platform.',
  })
  @ApiParam({ name: 'id', description: 'Booking Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Booking successfully removed.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }
}

