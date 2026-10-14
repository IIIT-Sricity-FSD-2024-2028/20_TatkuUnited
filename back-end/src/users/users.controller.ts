import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('Users')
@ApiBearerAuth('bearer-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Registers a new user record. Public callers can only create customer or provider accounts. Only admins can create admin or manager accounts.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload or email already exists.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admins can create other admins or managers.',
  })
  create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    if (
      createUserDto.role === Role.ADMIN ||
      createUserDto.role === Role.MANAGER
    ) {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user || user.role !== Role.ADMIN) {
        throw new ForbiddenException(
          'Only admins can create other admins and managers',
        );
      }
    }
    return this.usersService.create(createUserDto);
  }

  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description:
      'Retrieves all registered users without sensitive password fields. Requires admin privileges.',
  })
  @ApiResponse({ status: 200, description: 'List of all users.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Retrieves the complete profile document for the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current authenticated user profile.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getMe(@Req() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.usersService.findOne(user.userId);
  }

  @Roles(Role.ADMIN)
  @Get('role/:role')
  @ApiOperation({
    summary: 'Get users by role',
    description:
      'Retrieves all users filtered by role (customer, provider, manager, admin). Admin only.',
  })
  @ApiParam({
    name: 'role',
    enum: Role,
    description: 'Role enum filter',
    example: Role.PROVIDER,
  })
  @ApiResponse({
    status: 200,
    description: 'List of users with the given role.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires admin role.' })
  findByRole(@Param('role') role: Role) {
    return this.usersService.findByRole(role);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description:
      'Retrieves a single user document. Users can view their own profile; managers and admins can view any profile.',
  })
  @ApiParam({
    name: 'id',
    description: 'User Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'User found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Non-admins can only view their own user profile.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('id') id: string, @Req() req: any) {
    const user = req.user as AuthenticatedUser;
    if (
      user &&
      user.role !== Role.ADMIN &&
      user.role !== Role.MANAGER &&
      user.userId !== id
    ) {
      throw new ForbiddenException(
        'Access denied. You can only view your own user profile',
      );
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user profile',
    description:
      'Updates specific fields on an existing user. Users can only update their own profile; only admins can change user roles.',
  })
  @ApiParam({
    name: 'id',
    description: 'User Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User successfully updated.' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden. Cannot update another user profile or change roles without admin permissions.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
  ) {
    const user = req.user as AuthenticatedUser;
    if (user && user.role !== Role.ADMIN && user.userId !== id) {
      throw new ForbiddenException(
        'Access denied. You can only update your own user profile',
      );
    }
    if (updateUserDto.role && user && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can change user roles');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently removes a user record from the system.',
  })
  @ApiParam({
    name: 'id',
    description: 'User Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'User successfully removed.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  private checkAccess(req: any, targetUserId: string) {
    const user = req.user as AuthenticatedUser | undefined;
    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }
    if (user.role !== Role.ADMIN && user.userId !== targetUserId) {
      throw new ForbiddenException(
        'Access denied. You can only access your own user profile and cart',
      );
    }
  }

  // -- Addresses (§4.3) --------------------------------------------------------

  @Get(':id/addresses')
  @ApiOperation({
    summary: 'Get user saved addresses',
    description: 'Retrieves all saved delivery addresses for a customer.',
  })
  @ApiParam({
    name: 'id',
    description: 'User Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'List of saved addresses.' })
  async getAddresses(@Param('id') id: string, @Req() req: any) {
    this.checkAccess(req, id);
    const user = await this.usersService.findOne(id);
    return user.addresses || [];
  }

  @Post(':id/addresses')
  @ApiOperation({
    summary: 'Add saved address',
    description:
      'Appends a new address with label, line, city, and GeoJSON location to the user profile (§4.3).',
  })
  @ApiParam({
    name: 'id',
    description: 'User Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['line', 'city', 'location'],
      properties: {
        label: { type: 'string', example: 'Home' },
        line: { type: 'string', example: '123 Tech Park Ave' },
        city: { type: 'string', example: 'Chennai' },
        location: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'Point' },
            coordinates: {
              type: 'array',
              items: { type: 'number' },
              example: [80.0, 13.0],
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Address added.' })
  addAddress(@Param('id') id: string, @Body() address: any, @Req() req: any) {
    this.checkAccess(req, id);
    return this.usersService.addAddress(id, address);
  }

  @Delete(':id/addresses/:addressId')
  @ApiOperation({
    summary: 'Remove saved address',
    description: 'Removes an address by address ID from user saved addresses.',
  })
  @ApiParam({
    name: 'id',
    description: 'User Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiParam({
    name: 'addressId',
    description: 'Address ID string',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Address removed.' })
  removeAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
    @Req() req: any,
  ) {
    this.checkAccess(req, id);
    return this.usersService.removeAddress(id, addressId);
  }

  // -- Cart (§4.5) -------------------------------------------------------------

  @Get(':id/cart')
  @ApiOperation({
    summary: 'Get user shopping cart',
    description:
      'Retrieves current cart items and selected address populated with service info (§4.5).',
  })
  @ApiParam({
    name: 'id',
    description: 'User Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'User cart.' })
  getCart(@Param('id') id: string, @Req() req: any) {
    this.checkAccess(req, id);
    return this.usersService.getCart(id);
  }

  @Post(':id/cart')
  @ApiOperation({
    summary: 'Add item to shopping cart',
    description: 'Pushes a service reservation slot into the user cart (§4.5).',
  })
  @ApiParam({
    name: 'id',
    description: 'User Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['service', 'scheduledDate', 'startTime', 'endTime'],
      properties: {
        service: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
        scheduledDate: { type: 'string', example: '2026-10-15' },
        startTime: { type: 'number', example: 600 },
        endTime: { type: 'number', example: 660 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Item added to cart.' })
  addToCart(@Param('id') id: string, @Body() item: any, @Req() req: any) {
    this.checkAccess(req, id);
    return this.usersService.addToCart(id, item);
  }

  @Delete(':id/cart/:index')
  @ApiOperation({
    summary: 'Remove item from cart by index',
    description: 'Pulls an item from cart by array index (§4.5).',
  })
  @ApiParam({
    name: 'id',
    description: 'User Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiParam({
    name: 'index',
    description: 'Cart item index (0-indexed)',
    example: '0',
  })
  @ApiResponse({ status: 200, description: 'Cart updated.' })
  removeFromCart(
    @Param('id') id: string,
    @Param('index') index: string,
    @Req() req: any,
  ) {
    this.checkAccess(req, id);
    return this.usersService.removeFromCart(id, parseInt(index, 10));
  }

  @Delete(':id/cart')
  @ApiOperation({
    summary: 'Clear shopping cart',
    description: 'Empties cart items and resets selected address (§4.8).',
  })
  @ApiParam({
    name: 'id',
    description: 'User Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: 200, description: 'Cart cleared.' })
  clearCart(@Param('id') id: string, @Req() req: any) {
    this.checkAccess(req, id);
    return this.usersService.clearCart(id);
  }

  @Patch(':id/cart/address')
  @ApiOperation({
    summary: 'Select delivery address for cart',
    description:
      'Sets cart.address to one of the user saved address IDs (§4.5).',
  })
  @ApiParam({
    name: 'id',
    description: 'User Mongo ObjectId',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['addressId'],
      properties: {
        addressId: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Cart address selected.' })
  selectCartAddress(
    @Param('id') id: string,
    @Body('addressId') addressId: string,
    @Req() req: any,
  ) {
    this.checkAccess(req, id);
    return this.usersService.selectCartAddress(id, addressId);
  }
}

