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
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SuperUsersService } from './super-users.service';
import { CreateSuperUserDto } from './dto/create-super-user.dto';
import { UpdateSuperUserDto } from './dto/update-super-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('super-users')
@ApiBearerAuth('bearer')
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('super-users')
export class SuperUsersController {
  constructor(private readonly superUsersService: SuperUsersService) {}

  @Get()
  // @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Get all super users' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.superUsersService.findAll();
  }

  @Get(':id')
  // @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Get super user by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string) {
    return this.superUsersService.findOne(id);
  }

  @Post()
  // @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Create a new super user' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateSuperUserDto) {
    return this.superUsersService.create(dto);
  }

  @Patch(':id')
  // @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Update a super user' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(@Param('id') id: string, @Body() dto: UpdateSuperUserDto) {
    return this.superUsersService.update(id, dto);
  }

  @Delete(':id')
  // @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: false
  })
  @ApiOperation({ summary: 'Delete a super user' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.superUsersService.remove(id);
  }
}
