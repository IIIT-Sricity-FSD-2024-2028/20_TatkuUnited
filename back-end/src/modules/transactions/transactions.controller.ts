import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Transactions')
@ApiBearerAuth('bearer')
@ApiHeader({
  name: 'x-role',
  description: 'Caller role: super_user | customer | service_provider | unit_manager | collective_manager',
  required: true,
})
@ApiHeader({
  name: 'x-id',
  description: 'Caller user ID (UUID)',
  required: true,
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // ─────────────────────────── POST /transactions ──────────────────────────

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a transaction at checkout — customer only' })
  @ApiBody({ type: CreateTransactionDto })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({
    status: 409,
    description: 'Duplicate idempotency key or booking already has a transaction',
  })
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  // ─────────────────────────── GET /transactions ───────────────────────────

  @Get()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'List all transactions — super_user only' })
  @ApiResponse({ status: 200, description: 'Array of transactions' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.transactionsService.findAll();
  }

  // ──────────── GET /transactions/booking/:bookingId ───────────────────────
  // MUST be declared BEFORE GET /transactions/:id so NestJS doesn't treat
  // "booking" as the :id param value.

  @Get('booking/:bookingId')
  @Roles(Role.CUSTOMER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Get transaction by booking ID — customer or super_user' })
  @ApiParam({ name: 'bookingId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Transaction found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.transactionsService.findByBooking(bookingId);
  }

  // ─────────────────── GET /transactions/:id ──────────────────────────────

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get transaction by ID — super_user or unit_manager' })
  @ApiParam({ name: 'id', description: 'transaction_id UUID' })
  @ApiResponse({ status: 200, description: 'Transaction found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  // ─────────────────── PATCH /transactions/:id ────────────────────────────

  @Patch(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Update transaction status (webhook) — super_user only' })
  @ApiParam({ name: 'id', description: 'transaction_id UUID' })
  @ApiBody({ type: UpdateTransactionDto })
  @ApiResponse({ status: 200, description: 'Transaction updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.transactionsService.update(id, dto);
  }

  // ──────────── POST /transactions/:id/refund ─────────────────────────────

  @Post(':id/refund')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Refund a SUCCESS transaction — super_user only' })
  @ApiParam({ name: 'id', description: 'transaction_id UUID' })
  @ApiBody({
    schema: {
      properties: {
        reason: { type: 'string', example: 'Service not rendered' },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Refund applied; linked booking cancelled' })
  @ApiResponse({
    status: 400,
    description: 'Already refunded or not in SUCCESS state',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  refund(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.transactionsService.refund(id, reason);
  }

  // ─────────────────── DELETE /transactions/:id ───────────────────────────

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Void a transaction (soft — sets status to FAILED) — super_user' })
  @ApiParam({ name: 'id', description: 'transaction_id UUID' })
  @ApiResponse({ status: 200, description: 'Transaction voided' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }
}
