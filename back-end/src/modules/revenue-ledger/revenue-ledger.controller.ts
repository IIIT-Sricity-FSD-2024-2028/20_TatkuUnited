import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { RevenueLedgerService } from './revenue-ledger.service';
import { CreateRevenueLedgerDto } from './dto/create-revenue-ledger.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Revenue Ledger')
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
@Controller('revenue-ledger')
export class RevenueLedgerController {
  constructor(private readonly revenueLedgerService: RevenueLedgerService) {}

  // ── GET /revenue-ledger/summary/platform ────────────────────────────────

  @Get('summary/platform')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Platform-wide revenue summary — super_user only' })
  @ApiResponse({ status: 200, description: 'total / pending / disbursed platform amounts' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getPlatformSummary() {
    return this.revenueLedgerService.getPlatformSummary();
  }

  // ── GET /revenue-ledger/provider/:spId ──────────────────────────────────

  @Get('provider/:spId')
  @Roles(Role.SERVICE_PROVIDER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Provider earnings summary — SP (own) or super_user' })
  @ApiParam({ name: 'spId', description: 'sp_id UUID' })
  @ApiResponse({ status: 200, description: '{ pending, disbursed, rows }' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getProviderEarnings(@Param('spId') spId: string) {
    return this.revenueLedgerService.getProviderEarnings(spId);
  }

  // ── GET /revenue-ledger/unit-manager/:umId ──────────────────────────────

  @Get('unit-manager/:umId')
  @Roles(Role.UNIT_MANAGER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Unit Manager earnings — UM (own) or super_user' })
  @ApiParam({ name: 'umId', description: 'um_id UUID' })
  @ApiResponse({ status: 200, description: 'Unit manager earnings returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getUmEarnings(@Param('umId') umId: string) {
    return this.revenueLedgerService.getUmEarnings(umId);
  }

  // ── GET /revenue-ledger/collective/:cmId ────────────────────────────────

  @Get('collective/:cmId')
  @Roles(Role.COLLECTIVE_MANAGER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Collective Manager earnings — CM (own) or super_user' })
  @ApiParam({ name: 'cmId', description: 'cm_id UUID' })
  @ApiResponse({ status: 200, description: 'Collective manager earnings returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getCmEarnings(@Param('cmId') cmId: string) {
    return this.revenueLedgerService.getCmEarnings(cmId);
  }

  // ── PATCH /revenue-ledger/:id/payout ────────────────────────────────────

  @Patch(':id/payout')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Dispatch payout for a PENDING ledger entry — super_user only' })
  @ApiParam({ name: 'id', description: 'ledger_id UUID' })
  @ApiResponse({ status: 200, description: 'Payout disbursed; paid_at stamped' })
  @ApiResponse({ status: 400, description: 'Entry not in PENDING state' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Ledger entry not found' })
  dispatchPayout(@Param('id') id: string) {
    return this.revenueLedgerService.dispatchPayout(id);
  }

  // ── GET /revenue-ledger/:id ─────────────────────────────────────────────

  @Get(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Get ledger entry by ID — super_user only' })
  @ApiParam({ name: 'id', description: 'ledger_id UUID' })
  @ApiResponse({ status: 200, description: 'Ledger entry returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string) {
    return this.revenueLedgerService.findOne(id);
  }

  // ── POST /revenue-ledger ────────────────────────────────────────────────

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Manually create ledger entry — super_user only (admin correction)' })
  @ApiBody({ type: CreateRevenueLedgerDto })
  @ApiResponse({ status: 201, description: 'Ledger entry created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createRevenueLedgerDto: CreateRevenueLedgerDto) {
    return this.revenueLedgerService.create(createRevenueLedgerDto);
  }

  // ── GET /revenue-ledger ─────────────────────────────────────────────────

  @Get()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'List all ledger entries — super_user only' })
  @ApiResponse({ status: 200, description: 'Array of RevenueLedger rows' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.revenueLedgerService.findAll();
  }

  // ── DELETE /revenue-ledger/:id ──────────────────────────────────────────

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Hard delete a ledger entry — super_user only (admin correction)' })
  @ApiParam({ name: 'id', description: 'ledger_id UUID' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string) {
    return this.revenueLedgerService.delete(id);
  }
}
