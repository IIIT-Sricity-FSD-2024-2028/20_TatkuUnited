import {
  Controller,
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

  @Get('summary/platform')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Platform-wide revenue summary — super_user only' })
  @ApiResponse({ status: 200, description: 'total / pending / disbursed platform amounts' })
  getPlatformSummary() {
    return this.revenueLedgerService.getPlatformSummary();
  }

  @Get('my')
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Get current user earnings' })
  getMyEarnings(@Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.REGION_MANAGER) {
      return this.revenueLedgerService.getRmEarningsScoped(req.user.sub, req.user);
    }
    if (req.user.role === Role.SERVICE_PROVIDER) {
      return this.revenueLedgerService.getProviderEarningsScoped(req.user.sub, req.user);
    }
    return this.revenueLedgerService.getPlatformSummary();
  }

  @Get('provider/:spId')
  @Roles(Role.SERVICE_PROVIDER, Role.SUPER_USER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Provider earnings summary — SP (own), RM, or super_user' })
  @ApiParam({ name: 'spId', description: 'sp_id UUID' })
  getProviderEarnings(
    @Param('spId') spId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.revenueLedgerService.getProviderEarningsScoped(spId, req.user);
  }

  @Get('region-manager/:rmId')
  @Roles(Role.REGION_MANAGER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Region Manager earnings — RM (own) or super_user' })
  @ApiParam({ name: 'rmId', description: 'rm_id UUID' })
  getRmEarnings(
    @Param('rmId') rmId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.revenueLedgerService.getRmEarningsScoped(rmId, req.user);
  }

  @Patch(':id/payout')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Dispatch payout for a PENDING ledger entry — super_user only' })
  @ApiParam({ name: 'id', description: 'ledger_id UUID' })
  dispatchPayout(@Param('id') id: string) {
    return this.revenueLedgerService.dispatchPayout(id);
  }

  @Get(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Get ledger entry by ID — super_user only' })
  @ApiParam({ name: 'id', description: 'ledger_id UUID' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    return this.revenueLedgerService.findOneScoped(id, req.user);
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Manually create ledger entry — super_user only' })
  @ApiBody({ type: CreateRevenueLedgerDto })
  create(@Body() createRevenueLedgerDto: CreateRevenueLedgerDto) {
    return this.revenueLedgerService.create(createRevenueLedgerDto);
  }

  @Get()
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'List all ledger entries (scoped for managers)' })
  findAll(@Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.REGION_MANAGER) {
      const manager = this.accessScope.getRegionManager(req.user.sub);
      return this.revenueLedgerService.findAll().filter((row) => row.rm_id === manager.rm_id);
    }
    return this.revenueLedgerService.findAll();
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Hard delete a ledger entry — super_user only' })
  @ApiParam({ name: 'id', description: 'ledger_id UUID' })
  remove(@Param('id') id: string) {
    return this.revenueLedgerService.delete(id);
  }
}
