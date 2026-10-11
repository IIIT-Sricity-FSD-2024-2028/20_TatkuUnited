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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Registers a new user record. Roles can be customer, provider, manager, or admin.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid payload or email already exists.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves all registered users without sensitive password fields.',
  })
  @ApiResponse({ status: 200, description: 'List of all users.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a single user document by its MongoDB ObjectId.',
  })
  @ApiParam({ name: 'id', description: 'User Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'User found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates specific fields on an existing user.',
  })
  @ApiParam({ name: 'id', description: 'User Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User successfully updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently removes a user record from the system.',
  })
  @ApiParam({ name: 'id', description: 'User Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'User successfully removed.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

