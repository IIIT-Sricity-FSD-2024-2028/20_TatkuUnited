import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { LinkServiceSkillDto } from './dto/link-service-skill.dto';
import { UpsertServiceContentDto } from './dto/upsert-service-content.dto';
import { CreateServiceFaqDto } from './dto/create-service-faq.dto';
import { UpdateServiceFaqDto } from './dto/update-service-faq.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import { ApiRoleHeader } from '../../common/decorators/api-role-header.decorator';

@ApiTags('services')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ══════════════════════════════════════════════════════════
  // Core CRUD (Part 1)
  // ══════════════════════════════════════════════════════════

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({ status: 200, description: 'List of all services' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.servicesService.findAll();
  }

  @Get('available')
  @Public()
  @ApiOperation({ summary: 'Get all available services (is_available = true)' })
  @ApiResponse({ status: 200, description: 'List of available services' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAvailable() {
    return this.servicesService.findAvailable();
  }

  @Get('category/:categoryId')
  @Public()
  @ApiOperation({ summary: 'Get services by category ID' })
  @ApiResponse({ status: 200, description: 'List of services in the category' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.servicesService.findByCategory(categoryId);
  }

  // ══════════════════════════════════════════════════════════
  // ServiceSkills sub-resource (Part 2)
  // ══════════════════════════════════════════════════════════

  @Get(':id/skills')
  @Public()
  @ApiOperation({ summary: 'Get skills linked to a service' })
  @ApiResponse({ status: 200, description: 'List of skill links for the service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  getServiceSkills(@Param('id') id: string) {
    return this.servicesService.getServiceSkills(id);
  }

  @Post(':id/skills')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Link a skill to a service' })
  @ApiResponse({ status: 201, description: 'Skill linked to service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 409, description: 'Skill already linked' })
  @ApiResponse({ status: 403, description: 'Forbidden — super_user only' })
  linkSkill(@Param('id') id: string, @Body() dto: LinkServiceSkillDto) {
    return this.servicesService.linkSkill(id, dto.skill_id);
  }

  @Delete(':id/skills/:skillId')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Unlink a skill from a service' })
  @ApiResponse({ status: 200, description: 'Skill unlinked from service' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — super_user only' })
  unlinkSkill(@Param('id') id: string, @Param('skillId') skillId: string) {
    return this.servicesService.unlinkSkill(id, skillId);
  }

  // ══════════════════════════════════════════════════════════
  // ServiceContent sub-resource (Part 2)
  // ══════════════════════════════════════════════════════════

  @Get(':id/content')
  @Public()
  @ApiOperation({ summary: 'Get content (how it works, coverage) for a service' })
  @ApiResponse({ status: 200, description: 'Service content returned (or null if none)' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  getContent(@Param('id') id: string) {
    return this.servicesService.getContent(id);
  }

  @Put(':id/content')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Create or update service content (upsert)' })
  @ApiResponse({ status: 200, description: 'Service content upserted' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — super_user only' })
  upsertContent(@Param('id') id: string, @Body() dto: UpsertServiceContentDto) {
    return this.servicesService.upsertContent(id, dto);
  }

  // ══════════════════════════════════════════════════════════
  // ServiceFAQs sub-resource (Part 2)
  // ══════════════════════════════════════════════════════════

  @Get(':id/faqs')
  @Public()
  @ApiOperation({ summary: 'Get FAQs for a service' })
  @ApiResponse({ status: 200, description: 'List of FAQs for the service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  getFaqs(@Param('id') id: string) {
    return this.servicesService.getFaqs(id);
  }

  @Post(':id/faqs')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Create a FAQ for a service' })
  @ApiResponse({ status: 201, description: 'FAQ created' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — super_user only' })
  createFaq(@Param('id') id: string, @Body() dto: CreateServiceFaqDto) {
    return this.servicesService.createFaq(id, dto);
  }

  @Patch('faqs/:faqId')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Update a FAQ' })
  @ApiResponse({ status: 200, description: 'FAQ updated' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — super_user only' })
  updateFaq(@Param('faqId') faqId: string, @Body() dto: UpdateServiceFaqDto) {
    return this.servicesService.updateFaq(faqId, dto);
  }

  @Delete('faqs/:faqId')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete a FAQ' })
  @ApiResponse({ status: 200, description: 'FAQ deleted' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — super_user only' })
  deleteFaq(@Param('faqId') faqId: string) {
    return this.servicesService.deleteFaq(faqId);
  }

  // ══════════════════════════════════════════════════════════
  // Core CRUD continued (Part 1) — :id routes MUST come last
  // ══════════════════════════════════════════════════════════

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: 200, description: 'Service found' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden — super_user only' })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Update a service' })
  @ApiResponse({ status: 200, description: 'Service updated' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — super_user only' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete a service' })
  @ApiResponse({ status: 200, description: 'Service deleted' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — super_user only' })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
