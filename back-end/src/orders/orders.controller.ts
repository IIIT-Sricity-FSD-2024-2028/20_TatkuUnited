import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('Orders')
@ApiBearerAuth('bearer-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Post('checkout')
  @ApiOperation({
    summary: 'Checkout shopping cart into order, bookings, and mock payment',
    description:
      'Validates cart, checks provider availability, creates Order, Bookings (status: awaiting_provider), and Mock Payment in one Mongoose transaction.',
  })
  @ApiResponse({ status: 201, description: 'Order and bookings created for checkout.' })
  @ApiResponse({ status: 400, description: 'Validation failed or no providers available.' })
  checkout(@Req() req: any, @Body() body?: any) {
    const user = req.user as AuthenticatedUser;
    const customerId =
      body?.customerId && user?.role === Role.ADMIN
        ? body.customerId
        : user.userId;
    return this.ordersService.checkout(customerId);
  }

  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Post()
  @ApiOperation({
    summary: 'Create a new customer order',
    description:
      'Creates a checkout order record snapshotting address and total amount in paise, with a 15-minute expiration timestamp.',
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid order payload.' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Roles(Role.CUSTOMER, Role.MANAGER, Role.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'Get all orders',
    description: 'Retrieves all orders, populated with customer profile data.',
  })
  @ApiResponse({ status: 200, description: 'List of all orders.' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Roles(Role.CUSTOMER, Role.MANAGER, Role.ADMIN)
  @Get('customer/:customerId')
  @ApiOperation({
    summary: 'Get orders by customer ID',
    description:
      'Retrieves all orders placed by a specific customer, sorted by creation date descending.',
  })
  @ApiParam({
    name: 'customerId',
    description: 'Customer User Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'List of customer orders.' })
  findByCustomer(@Param('customerId') customerId: string, @Req() req: any) {
    const user = req.user as AuthenticatedUser;
    if (user.role === Role.CUSTOMER && user.userId !== customerId) {
      throw new ForbiddenException('Access denied. You can only view your own orders');
    }
    return this.ordersService.findByCustomer(customerId);
  }

  @Roles(Role.MANAGER, Role.ADMIN)
  @Get('status/:status')
  @ApiOperation({
    summary: 'Get orders by payment status',
    description:
      'Retrieves all orders matching paymentStatus (created, paid, failed, refunded, partially_refunded).',
  })
  @ApiParam({ name: 'status', description: 'Payment status', example: 'paid' })
  @ApiResponse({ status: 200, description: 'List of orders with status.' })
  findByStatus(@Param('status') status: string) {
    return this.ordersService.findByStatus(status);
  }

  @Roles(Role.CUSTOMER, Role.MANAGER, Role.ADMIN)
  @Get(':id')
  @ApiOperation({
    summary: 'Get order by ID',
    description: 'Retrieves single order details by its Mongo ObjectId.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Order found.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const user = req.user as AuthenticatedUser;
    const order = await this.ordersService.findOne(id);
    if (user.role === Role.CUSTOMER && order.customer?.toString() !== user.userId) {
      throw new ForbiddenException('Access denied. You can only view your own order');
    }
    return order;
  }

  @Roles(Role.CUSTOMER, Role.MANAGER, Role.ADMIN)
  @Get(':id/details')
  @ApiOperation({
    summary: 'Get order with populated customer and payment details',
    description:
      'Retrieves single order details populated with customer and payment references.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Order details found.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async findWithDetails(@Param('id') id: string, @Req() req: any) {
    const user = req.user as AuthenticatedUser;
    const order: any = await this.ordersService.findWithDetails(id);
    const orderCustomer = order.customer?._id?.toString() || order.customer?.toString();
    if (user.role === Role.CUSTOMER && orderCustomer !== user.userId) {
      throw new ForbiddenException('Access denied. You can only view your own order details');
    }
    return order;
  }

  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update order',
    description:
      'Updates order status (e.g. paid, failed, refunded) or associated fields.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: 'Order updated successfully.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete order',
    description: 'Removes an order document from the database.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Order successfully removed.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
