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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ApiRoleHeader } from '../../common/decorators/api-role-header.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('regions')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('regions')
export class RegionsController {
  constructor(private readonly service: RegionsService) {}

  @Get()
  @Public()
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Get all regions' })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.REGION_MANAGER)
  @ApiOperation({ summary: 'Get region by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    return this.service.findOneScoped(id, req.user);
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Create a new region' })
  @ApiResponse({ status: 201, description: 'Created' })
  create(@Body() dto: CreateRegionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Update region' })
  @ApiResponse({ status: 200, description: 'Updated' })
  update(@Param('id') id: string, @Body() dto: UpdateRegionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete region' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
