import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { DatabaseService, Cart, CartItem } from '../../common/database/database.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCartMetaDto } from './dto/update-cart-meta.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepo: CartRepository,
    private readonly db: DatabaseService,
  ) {}

  // ── Get or create cart ─────────────────────────────────

  private getOrCreateCart(customerId: string): Cart {
    let cart = this.cartRepo.findCartByCustomer(customerId);
    if (cart) return cart;

    // Look up customer for default address
    const customer = this.db.customers.find(
      (c) => c.customer_id === customerId,
    );
    const address = customer?.address || '';

    cart = this.cartRepo.createCart({
      customer_id: customerId,
      service_address: address,
    });
    return cart;
  }

  // ── Get cart with items ────────────────────────────────

  getCartWithItems(customerId: string) {
    const cart = this.getOrCreateCart(customerId);
    const rawItems = this.cartRepo.findItemsByCart(cart.cart_id);
    // Enrich items with service name for frontend display
    const items = rawItems.map((item) => {
      const service = this.db.services.find(
        (s) => s.service_id === item.service_id,
      );
      return {
        ...item,
        service_name: service?.service_name || 'Service',
        service: service?.service_name || 'Service',
        price: item.price_snapshot,
        location: cart.service_address || '',
      };
    });
    return { ...cart, items };
  }

  // ── Add item ───────────────────────────────────────────

  addItem(customerId: string, dto: AddCartItemDto): CartItem {
    const cart = this.getOrCreateCart(customerId);

    // Validate service exists
    const service = this.db.services.find(
      (s) => s.service_id === dto.service_id,
    );
    if (!service) {
      throw new NotFoundException(
        `Service with id "${dto.service_id}" not found`,
      );
    }

    // Add new item with price snapshot and schedule
    return this.cartRepo.addItem({
      cart_id: cart.cart_id,
      service_id: dto.service_id,
      quantity: 1, // Each item is a separate appointment
      price_snapshot: service.base_price,
      booking_type: dto.booking_type || 'INSTANT',
      scheduled_at: dto.scheduled_at || null,
    });
  }

  // ── Update item quantity ───────────────────────────────

  updateItemQuantity(
    customerId: string,
    cartItemId: string,
    dto: UpdateCartItemDto,
  ): CartItem {
    const cart = this.getOrCreateCart(customerId);
    const item = this.cartRepo.findItemById(cartItemId);

    if (!item || item.cart_id !== cart.cart_id) {
      throw new NotFoundException(
        `Cart item "${cartItemId}" not found in your cart`,
      );
    }

    const updated = this.cartRepo.updateItem(cartItemId, {
      quantity: dto.quantity,
    });
    return updated!;
  }

  // ── Remove item ────────────────────────────────────────

  removeItem(customerId: string, cartItemId: string) {
    const cart = this.getOrCreateCart(customerId);
    const item = this.cartRepo.findItemById(cartItemId);

    if (!item || item.cart_id !== cart.cart_id) {
      throw new NotFoundException(
        `Cart item "${cartItemId}" not found in your cart`,
      );
    }

    this.cartRepo.removeItem(cartItemId);
    return { message: 'Item removed', cart_item_id: cartItemId };
  }

  // ── Clear cart ─────────────────────────────────────────

  clearCart(customerId: string) {
    const cart = this.getOrCreateCart(customerId);
    this.cartRepo.clearCartItems(cart.cart_id);
    return { message: 'Cart cleared', cart_id: cart.cart_id };
  }

  // ── Update cart meta ───────────────────────────────────

  updateCartMeta(customerId: string, dto: UpdateCartMetaDto) {
    const cart = this.getOrCreateCart(customerId);

    const updates: Partial<Cart> = {};
    if (dto.service_address !== undefined)
      updates.service_address = dto.service_address;

    const updated = this.cartRepo.updateCart(cart.cart_id, updates);
    const items = this.cartRepo.findItemsByCart(cart.cart_id);
    return { ...updated, items };
  }
}
