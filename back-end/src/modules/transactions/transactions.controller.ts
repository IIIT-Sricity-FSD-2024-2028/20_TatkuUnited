import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
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
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AccessScopeService } from '../../common/access/access-scope.service';
import {
  ApiActorIdHeader,
  ApiRoleHeader,
} from '../../common/decorators/api-role-header.decorator';

@ApiTags('Transactions')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@ApiActorIdHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly accessScope: AccessScopeService,
  ) {}


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
  create(@Body() dto: CreateTransactionDto, @Request() req: { user: JwtPayload }) {
    return this.transactionsService.create(dto, req.user);
  }

  // ─────────────────────────── GET /transactions ───────────────────────────

  @Get()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'List all transactions (scoped for managers)' })
  @ApiResponse({ status: 200, description: 'Array of transactions' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.COLLECTIVE_MANAGER || req.user.role === Role.UNIT_MANAGER) {
      return this.transactionsService.findAll().filter((txn) => {
        const booking = this.transactionsService.findBooking(txn.booking_id);
        try {
          this.accessScope.assertSectorAccess(req.user, booking.sector_id);
          return true;
        } catch (e) {
          return false;
        }
      });
    }
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
  findByBooking(
    @Param('bookingId') bookingId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.transactionsService.findByBookingScoped(bookingId, req.user);
  }

  // ─────────────────── GET /transactions/:id ──────────────────────────────

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'Get transaction by ID — super_user or unit_manager' })
  @ApiParam({ name: 'id', description: 'transaction_id UUID' })
  @ApiResponse({ status: 200, description: 'Transaction found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    return this.transactionsService.findOneScoped(id, req.user);
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
