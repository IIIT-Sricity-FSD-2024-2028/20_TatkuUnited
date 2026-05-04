import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCartMetaDto } from './dto/update-cart-meta.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ApiRoleHeader } from '../../common/decorators/api-role-header.decorator';

@ApiTags('cart')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Get my cart with items (auto-creates if none)' })
  @ApiResponse({ status: 200, description: 'Cart with items returned' })
  @ApiResponse({ status: 403, description: 'Forbidden — customer only' })
  getCart(@Request() req) {
    return this.cartService.getCartWithItems(req.user.sub);
  }

  @Post('items')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Add an item to cart (or increment if already in cart)' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — customer only' })
  addItem(@Request() req, @Body() dto: AddCartItemDto) {
    console.log('Received addItem DTO:', dto);
    return this.cartService.addItem(req.user.sub, dto);
  }

  @Patch('items/:itemId')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Item quantity updated' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — customer only' })
  updateItemQuantity(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(req.user.sub, itemId, dto);
  }

  @Delete('items/:itemId')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Remove a single item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — customer only' })
  removeItem(@Request() req, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(req.user.sub, itemId);
  }

  @Delete('items')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Clear entire cart (remove all items)' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  @ApiResponse({ status: 403, description: 'Forbidden — customer only' })
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.sub);
  }

  @Patch()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Update cart metadata (booking_type, scheduled_at, service_address)' })
  @ApiResponse({ status: 200, description: 'Cart metadata updated' })
  @ApiResponse({ status: 403, description: 'Forbidden — customer only' })
  updateCartMeta(@Request() req, @Body() dto: UpdateCartMetaDto) {
    return this.cartService.updateCartMeta(req.user.sub, dto);
  }
}
