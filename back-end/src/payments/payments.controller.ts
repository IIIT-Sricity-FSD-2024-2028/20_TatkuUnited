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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';

@ApiTags('Payments')
@ApiBearerAuth('bearer-token')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Post()
  @ApiOperation({
    summary: 'Create a new payment record',
    description:
      'Creates a payment record linked to an Order, total amount in paise, currency, and Razorpay order ID.',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment successfully initialized.',
  })
  @ApiResponse({ status: 400, description: 'Invalid payment data.' })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Roles(Role.CUSTOMER, Role.MANAGER, Role.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'Get all payments',
    description:
      'Retrieves all payment transactions populated with order data.',
  })
  @ApiResponse({ status: 200, description: 'List of all payments.' })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Roles(Role.CUSTOMER, Role.MANAGER, Role.ADMIN)
  @Get('order/:orderId')
  @ApiOperation({
    summary: 'Get payment by order ID',
    description:
      'Retrieves payment transaction record associated with an order ID.',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Order Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Payment record found.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  findByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.findByOrder(orderId);
  }

  @Roles(Role.CUSTOMER, Role.MANAGER, Role.ADMIN)
  @Get(':id')
  @ApiOperation({
    summary: 'Get payment by ID',
    description:
      'Retrieves a single payment transaction by its Mongo ObjectId.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Payment found.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update payment status or details',
    description:
      'Updates payment status, Razorpay payment ID, method, or refund details.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiBody({ type: UpdatePaymentDto })
  @ApiResponse({ status: 200, description: 'Payment successfully updated.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete payment record',
    description: 'Removes a payment record from the database.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Payment successfully removed.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}
