import { Injectable } from '@nestjs/common';
import {
  DatabaseService,
  Cart,
  CartItem,
} from '../../common/database/database.service';

@Injectable()
export class CartRepository {
  constructor(private readonly db: DatabaseService) {}

  // --- Cart ---
  findCartByCustomer(customer_id: string): Cart | undefined {
    return this.db.carts.find((c) => c.customer_id === customer_id);
  }

  findCartById(cart_id: string): Cart | undefined {
    return this.db.carts.find((c) => c.cart_id === cart_id);
  }

  createCart(data: Omit<Cart, 'cart_id' | 'created_at' | 'updated_at'>): Cart {
    const cart: Cart = {
      ...data,
      cart_id: this.db.genId(),
      created_at: this.db.now(),
      updated_at: this.db.now(),
    };
    this.db.carts.push(cart);
    return cart;
  }

  updateCart(cart_id: string, data: Partial<Cart>): Cart | undefined {
    const idx = this.db.carts.findIndex((c) => c.cart_id === cart_id);
    if (idx === -1) return undefined;
    this.db.carts[idx] = {
      ...this.db.carts[idx],
      ...data,
      updated_at: this.db.now(),
    };
    return this.db.carts[idx];
  }

  deleteCart(cart_id: string): boolean {
    const idx = this.db.carts.findIndex((c) => c.cart_id === cart_id);
    if (idx === -1) return false;
    this.db.carts.splice(idx, 1);
    return true;
  }

  // --- Cart Items ---
  findItemsByCart(cart_id: string): CartItem[] {
    return this.db.cartItems.filter((i) => i.cart_id === cart_id);
  }

  findItemById(cart_item_id: string): CartItem | undefined {
    return this.db.cartItems.find((i) => i.cart_item_id === cart_item_id);
  }

  findItemByCartAndService(
    cart_id: string,
    service_id: string,
  ): CartItem | undefined {
    return this.db.cartItems.find(
      (i) => i.cart_id === cart_id && i.service_id === service_id,
    );
  }

  addItem(data: Omit<CartItem, 'cart_item_id' | 'added_at'>): CartItem {
    const item: CartItem = {
      ...data,
      cart_item_id: this.db.genId(),
      added_at: this.db.now(),
    };
    this.db.cartItems.push(item);
    return item;
  }

  updateItem(
    cart_item_id: string,
    data: Partial<CartItem>,
  ): CartItem | undefined {
    const idx = this.db.cartItems.findIndex(
      (i) => i.cart_item_id === cart_item_id,
    );
    if (idx === -1) return undefined;
    this.db.cartItems[idx] = { ...this.db.cartItems[idx], ...data };
    return this.db.cartItems[idx];
  }

  removeItem(cart_item_id: string): boolean {
    const idx = this.db.cartItems.findIndex(
      (i) => i.cart_item_id === cart_item_id,
    );
    if (idx === -1) return false;
    this.db.cartItems.splice(idx, 1);
    return true;
  }

  clearCartItems(cart_id: string): void {
    this.db.cartItems = this.db.cartItems.filter((i) => i.cart_id !== cart_id);
  }
}
