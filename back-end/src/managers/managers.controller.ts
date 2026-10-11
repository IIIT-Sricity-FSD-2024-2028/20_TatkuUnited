import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ManagersService } from './managers.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';

@ApiTags('Managers')
@Controller('managers')
export class ManagersController {
  constructor(private readonly managersService: ManagersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create / register a regional manager',
    description: 'Creates a manager record linked to a User, with salary, experience, and office GeoLocation.',
  })
  @ApiBody({ type: CreateManagerDto })
  @ApiResponse({ status: 201, description: 'Manager successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid manager payload.' })
  create(@Body() createManagerDto: CreateManagerDto) {
    return this.managersService.create(createManagerDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all regional managers',
    description: 'Retrieves all managers with populated user info and active status.',
  })
  @ApiResponse({ status: 200, description: 'List of all managers.' })
  findAll() {
    return this.managersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get manager by ID',
    description: 'Retrieves a single manager by its Mongo ObjectId.',
  })
  @ApiParam({ name: 'id', description: 'Manager Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Manager found.' })
  @ApiResponse({ status: 404, description: 'Manager not found.' })
  findOne(@Param('id') id: string) {
    return this.managersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update manager profile',
    description: 'Updates manager status (active, suspended, inactive), salary, or office location.',
  })
  @ApiParam({ name: 'id', description: 'Manager Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ type: UpdateManagerDto })
  @ApiResponse({ status: 200, description: 'Manager updated successfully.' })
  @ApiResponse({ status: 404, description: 'Manager not found.' })
  update(@Param('id') id: string, @Body() updateManagerDto: UpdateManagerDto) {
    return this.managersService.update(id, updateManagerDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete manager',
    description: 'Permanently removes a regional manager.',
  })
  @ApiParam({ name: 'id', description: 'Manager Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Manager successfully removed.' })
  @ApiResponse({ status: 404, description: 'Manager not found.' })
  remove(@Param('id') id: string) {
    return this.managersService.remove(id);
  }
}

