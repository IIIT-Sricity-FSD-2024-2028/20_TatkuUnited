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
import { ServiceProvidersService } from './service-providers.service';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { ApproveServiceProviderDto } from './dto/approve-service-provider.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

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
    return this.serviceProvidersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceProviderDto: UpdateServiceProviderDto) {
    return this.serviceProvidersService.update(id, updateServiceProviderDto);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveServiceProviderDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.serviceProvidersService.approve(
      id,
      approveDto.unit_id,
      req.user,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceProvidersService.remove(id);
  }
}
