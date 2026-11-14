/** Serialized counterpart of back-end/src/schema/order.schema.ts. */
import type { Payment, User, AddressSnapshot, BaseDocument, ISODateString, Reference, PaymentStatus } from './index';

export interface Order extends BaseDocument {
  customer: Reference<User>;
  address: AddressSnapshot;
  totalAmount: number;
  payment: Reference<Payment> | null;
  paymentStatus: PaymentStatus;
  expiresAt: ISODateString;
}

export type OrderDocument = Order;
