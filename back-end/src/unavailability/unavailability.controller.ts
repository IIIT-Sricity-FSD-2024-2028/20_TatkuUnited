import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UnavailabilityService } from './unavailability.service';
import { CreateUnavailabilityDto } from './dto/create-unavailability.dto';
import { UpdateUnavailabilityDto } from './dto/update-unavailability.dto';

@Controller('unavailability')
export class UnavailabilityController {
  constructor(private readonly unavailabilityService: UnavailabilityService) {}

  @Post()
  create(@Body() createUnavailabilityDto: CreateUnavailabilityDto) {
    return this.unavailabilityService.create(createUnavailabilityDto);
  }

  @Get()
  findAll() {
    return this.unavailabilityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unavailabilityService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUnavailabilityDto: UpdateUnavailabilityDto) {
    return this.unavailabilityService.update(+id, updateUnavailabilityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unavailabilityService.remove(+id);
  }
}
