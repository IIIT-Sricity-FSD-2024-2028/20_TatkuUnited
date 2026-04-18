import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SuperUsersService } from './super-users.service';
import { CreateSuperUserDto } from './dto/create-super-user.dto';
import { UpdateSuperUserDto } from './dto/update-super-user.dto';

@Controller('super-users')
export class SuperUsersController {
  constructor(private readonly superUsersService: SuperUsersService) {}

  @Post()
  create(@Body() createSuperUserDto: CreateSuperUserDto) {
    return this.superUsersService.create(createSuperUserDto);
  }

  @Get()
  findAll() {
    return this.superUsersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.superUsersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSuperUserDto: UpdateSuperUserDto) {
    return this.superUsersService.update(+id, updateSuperUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.superUsersService.remove(+id);
  }
}
