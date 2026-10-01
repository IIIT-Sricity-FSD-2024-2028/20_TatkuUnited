import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags } from '@nestjs/swagger';
import { ProviderSkillsService } from './provider-skills.service';
import { CreateProviderSkillDto } from './dto/create-provider-skill.dto';
import { VerifyProviderSkillDto } from './dto/verify-provider-skill.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AccessScopeService } from '../../common/access/access-scope.service';
import { ApiRoleHeader } from '../../common/decorators/api-role-header.decorator';

@ApiTags('provider-skills')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('provider-skills')
export class ProviderSkillsController {
  constructor(
    private readonly providerSkillsService: ProviderSkillsService,
    private readonly accessScope: AccessScopeService,
  ) {}

  @Get()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Get all provider skills' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Request() req: { user: JwtPayload }) {
    return this.providerSkillsService.findAll();
  }

  @Get('provider/:provider_id')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get provider skills by provider ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByProvider(
    @Param('provider_id') providerId: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.SERVICE_PROVIDER && req.user.sub !== providerId) {
      throw new ForbiddenException('Providers can only access their own skills');
    }
    return this.providerSkillsService.findByProvider(providerId);
  }

  @Get('skill/:skill_id')
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get providers by skill ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findBySkill(
    @Param('skill_id') skillId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.providerSkillsService.findBySkill(skillId);
  }

  @Post()
  @Roles(Role.SUPER_USER, Role.SERVICE_PROVIDER)
  @ApiOperation({ summary: 'Assign skill to provider' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateProviderSkillDto, @Request() req: { user: JwtPayload }) {
    if (
      req.user.role === Role.SERVICE_PROVIDER &&
      req.user.sub !== dto.service_provider_id
    ) {
      throw new ForbiddenException('Providers can only request skills for themselves');
    }
    return this.providerSkillsService.create(dto);
  }

  @Patch('verify/:id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Verify provider skill' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  verifySkill(
    @Param('id') providerId: string,
    @Body() dto: VerifyProviderSkillDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.providerSkillsService.verifySkill(providerId, dto.skill_id);
  }

  @Patch('reject/:id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Reject provider skill verification request' })
  @ApiResponse({ status: 200, description: 'Skill request rejected and removed' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  rejectSkill(
    @Param('id') providerId: string,
    @Body() dto: VerifyProviderSkillDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.providerSkillsService.rejectSkill(providerId, dto.skill_id);
  }
}
