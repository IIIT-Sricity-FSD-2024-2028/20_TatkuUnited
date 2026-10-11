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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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

  @Get()
  @ApiOperation({
    summary: 'Get all orders',
    description: 'Retrieves all orders, populated with customer profile data.',
  })
  @ApiResponse({ status: 200, description: 'List of all orders.' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order by ID',
    description: 'Retrieves single order details by its Mongo ObjectId.',
  })
  @ApiParam({ name: 'id', description: 'Order Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Order found.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update order',
    description: 'Updates order status (e.g. paid, failed, refunded) or associated fields.',
  })
  @ApiParam({ name: 'id', description: 'Order Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: 'Order updated successfully.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete order',
    description: 'Removes an order document from the database.',
  })
  @ApiParam({ name: 'id', description: 'Order Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Order successfully removed.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}

