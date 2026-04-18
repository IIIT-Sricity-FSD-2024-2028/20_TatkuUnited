import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServiceProvidersService } from './service-providers.service';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';

@Controller('service-providers')
export class ServiceProvidersController {
  constructor(private readonly serviceProvidersService: ServiceProvidersService) {}

  @Post()
  create(@Body() createServiceProviderDto: CreateServiceProviderDto) {
    return this.serviceProvidersService.create(createServiceProviderDto);
  }

  @Get()
  findAll() {
    return this.serviceProvidersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceProvidersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceProviderDto: UpdateServiceProviderDto) {
    return this.serviceProvidersService.update(+id, updateServiceProviderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceProvidersService.remove(+id);
  }
}
