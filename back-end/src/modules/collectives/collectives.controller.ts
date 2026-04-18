import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiHeader } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreateCollectiveDto } from './dto/create-collective.dto';

@ApiTags('collectives')
@ApiHeader({ name: 'x-role', description: 'Caller role', enum: Role })
@ApiSecurity('x-role')
@UseGuards(RolesGuard)
@Controller('collectives')
export class CollectivesController {
  @Get()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
  @ApiOperation({ summary: 'List all collectives' })
  findAll() {
    // Implementation to list collectives
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiOperation({ summary: 'Create a collective' })
  create(@Body() dto: CreateCollectiveDto) {
    // Implementation to create a collective
  }
}
