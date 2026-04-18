import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProviderUnavailabilityService } from './provider-unavailability.service';
import { CreateProviderUnavailabilityDto } from './dto/create-provider-unavailability.dto';
import { UpdateProviderUnavailabilityDto } from './dto/update-provider-unavailability.dto';

@Controller('provider-unavailability')
export class ProviderUnavailabilityController {
  constructor(private readonly providerUnavailabilityService: ProviderUnavailabilityService) {}

  @Post()
  create(@Body() createProviderUnavailabilityDto: CreateProviderUnavailabilityDto) {
    return this.providerUnavailabilityService.create(createProviderUnavailabilityDto);
  }

  @Get()
  findAll() {
    return this.providerUnavailabilityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.providerUnavailabilityService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProviderUnavailabilityDto: UpdateProviderUnavailabilityDto) {
    return this.providerUnavailabilityService.update(+id, updateProviderUnavailabilityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.providerUnavailabilityService.remove(+id);
  }
}
