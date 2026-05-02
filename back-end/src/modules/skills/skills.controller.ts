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
import { ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags, ApiHeader } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('skills')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER, Role.SERVICE_PROVIDER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get all skills' })
  
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })@ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.skillsService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER, Role.SERVICE_PROVIDER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get skill by ID' })
  
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })@ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Create a new skill' })
  
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })@ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateSkillDto) {
    return this.skillsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Update a skill' })
  
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })@ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.skillsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete a skill' })
  
  @ApiHeader({ name: 'x-role', required: true, description: 'User role (customer, super_user, service_provider)' })@ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.skillsService.remove(id);
  }
}
