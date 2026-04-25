import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('customers')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.customersService.findAll();
  }

  @Get('sector/:sector_id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiHeader({ name: 'Authorization', description: 'Bearer token', required: true })
  @ApiOperation({ summary: 'Get customers by sector ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findBySector(@Param('sector_id') sectorId: string) {
    return this.customersService.findBySector(sectorId);
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.CUSTOMER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.CUSTOMER && req.user.sub !== id) {
      throw new ForbiddenException('Customers can only access their own account');
    }
    return this.customersService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER, Role.CUSTOMER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.CUSTOMER && req.user.sub !== id) {
      throw new ForbiddenException('Customers can only update their own account');
    }
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true
  })
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  @Delete('account/:id')
  @Roles(Role.SUPER_USER, Role.CUSTOMER)
  @ApiHeader({ name: 'Authorization', description: 'Bearer token', required: true })
  @ApiOperation({ summary: 'Delete customer account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  deleteAccount(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    if (req.user.role === Role.CUSTOMER && req.user.sub !== id) {
      throw new ForbiddenException('Customers can only delete their own account');
    }
    return this.customersService.remove(id);
  }
}
