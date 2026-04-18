import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UnitManagersService } from './unit-managers.service';
import { CreateUnitManagerDto } from './dto/create-unit-manager.dto';
import { UpdateUnitManagerDto } from './dto/update-unit-manager.dto';

@Controller('unit-managers')
export class UnitManagersController {
  constructor(private readonly unitManagersService: UnitManagersService) {}

  @Post()
  create(@Body() createUnitManagerDto: CreateUnitManagerDto) {
    return this.unitManagersService.create(createUnitManagerDto);
  }

  @Get()
  findAll() {
    return this.unitManagersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unitManagersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUnitManagerDto: UpdateUnitManagerDto) {
    return this.unitManagersService.update(+id, updateUnitManagerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unitManagersService.remove(+id);
  }
}
