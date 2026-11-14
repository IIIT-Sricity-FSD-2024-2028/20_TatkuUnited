/** Serialized counterpart of back-end/src/schema/payment.schema.ts. */
import type { Booking, Order, BaseDocument, ISODateString, Reference, RefundStatus } from './index';

export interface RefundEntry {
  booking: Reference<Booking>;
  amount: number;
  razorpayRefundId: string;
  status: RefundStatus;
  createdAt: ISODateString;
}

export interface Payment extends BaseDocument {
  order: Reference<Order>;
  totalAmount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  refunds: RefundEntry[];
}

export type PaymentDocument = Payment;
