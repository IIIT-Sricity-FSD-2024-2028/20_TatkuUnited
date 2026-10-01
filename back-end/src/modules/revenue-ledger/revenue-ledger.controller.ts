import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { RevenueLedgerService } from './revenue-ledger.service';
import { CreateRevenueLedgerDto } from './dto/create-revenue-ledger.dto';
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

@ApiTags('Revenue Ledger')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@ApiActorIdHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('revenue-ledger')
export class RevenueLedgerController {
  constructor(
    private readonly revenueLedgerService: RevenueLedgerService,
    private readonly accessScope: AccessScopeService,
  ) {}


  // ── GET /revenue-ledger/summary/platform ────────────────────────────────

  @Get('summary/platform')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Platform-wide revenue summary — super_user only' })
  @ApiResponse({ status: 200, description: 'total / pending / disbursed platform amounts' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getPlatformSummary() {
    return this.revenueLedgerService.getPlatformSummary();
  }

  @Get('my')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Get current user earnings' })
  getMyEarnings(@Request() req: { user: JwtPayload }) {
    console.log(`RevenueLedgerController: getMyEarnings for ${req.user.sub} (${req.user.role})`);
    if (req.user.role === Role.COLLECTIVE_MANAGER) {
      const res = this.revenueLedgerService.getCmEarningsScoped(req.user.sub, req.user);
      console.log(`RevenueLedgerController: Found ${res.rows.length} rows for CM`);
      return res;
    }
    if (req.user.role === Role.UNIT_MANAGER) {
      return this.revenueLedgerService.getUmEarningsScoped(req.user.sub, req.user);
    }
    if (req.user.role === Role.SERVICE_PROVIDER) {
      return this.revenueLedgerService.getProviderEarningsScoped(req.user.sub, req.user);
    }
    return this.revenueLedgerService.getPlatformSummary();
  }

  // ── GET /revenue-ledger/provider/:spId ──────────────────────────────────

  @Get('provider/:spId')
  @Roles(Role.SERVICE_PROVIDER, Role.SUPER_USER, Role.UNIT_MANAGER, Role.COLLECTIVE_MANAGER)
  @ApiOperation({ summary: 'Provider earnings summary — SP (own) or super_user' })
  @ApiParam({ name: 'spId', description: 'sp_id UUID' })
  @ApiResponse({ status: 200, description: '{ pending, disbursed, rows }' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getProviderEarnings(
    @Param('spId') spId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.revenueLedgerService.getProviderEarningsScoped(spId, req.user);
  }

  // ── GET /revenue-ledger/unit-manager/:umId ──────────────────────────────

  @Get('unit-manager/:umId')
  @Roles(Role.UNIT_MANAGER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Unit Manager earnings — UM (own) or super_user' })
  @ApiParam({ name: 'umId', description: 'um_id UUID' })
  @ApiResponse({ status: 200, description: 'Unit manager earnings returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getUmEarnings(
    @Param('umId') umId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.revenueLedgerService.getUmEarningsScoped(umId, req.user);
  }

  // ── GET /revenue-ledger/collective/:cmId ────────────────────────────────

  @Get('collective/:cmId')
  @Roles(Role.COLLECTIVE_MANAGER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Collective Manager earnings — CM (own) or super_user' })
  @ApiParam({ name: 'cmId', description: 'cm_id UUID' })
  @ApiResponse({ status: 200, description: 'Collective manager earnings returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getCmEarnings(
    @Param('cmId') cmId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.revenueLedgerService.getCmEarningsScoped(cmId, req.user);
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
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    return this.revenueLedgerService.findOneScoped(id, req.user);
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
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'List all ledger entries (scoped for managers)' })
  @ApiResponse({ status: 200, description: 'Array of RevenueLedger rows' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.COLLECTIVE_MANAGER) {
      const manager = this.accessScope.getCollectiveManager(req.user.sub);
      return this.revenueLedgerService.findAll().filter((row) => row.cm_id === manager.cm_id);
    }
    if (req.user.role === Role.UNIT_MANAGER) {
      const manager = this.accessScope.getUnitManager(req.user.sub);
      return this.revenueLedgerService.findAll().filter((row) => row.um_id === manager.um_id);
    }
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
