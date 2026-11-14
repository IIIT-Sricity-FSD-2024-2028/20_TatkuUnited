/** Serialized counterpart of back-end/src/schema/booking.schema.ts. */
import type { Order, Provider, Region, Service, User, BaseDocument, ISODateString, Reference, BookingStatus, CancelledBy, PayoutStatus } from './index';

export interface BookingOffer {
  provider: Reference<Provider>;
  status: 'offered' | 'declined' | 'expired' | 'accepted';
  offeredAt: ISODateString;
  expiresAt: ISODateString;
}

export interface Booking extends BaseDocument {
  service: Reference<Service>;
  provider: Reference<Provider> | null;
  customer: Reference<User>;
  order: Reference<Order>;
  region: Reference<Region>;
  scheduledDate: ISODateString;
  startTime: number;
  endTime: number;
  blockStartTime: number;
  status: BookingStatus;
  cancelledBy: CancelledBy | null;
  cancelledReason: string | null;
  offers: BookingOffer[];
  offerRound: number;
  offerExpiresAt: ISODateString | null;
  declinedBy: Reference<Provider>[];
  price: number;
  platformFeePercent: number;
  platformShare: number;
  providerShare: number;
  payoutStatus: PayoutStatus;
  payoutAt: ISODateString | null;
  completedAt: ISODateString | null;
  completionRejectedAt: ISODateString | null;
}

export type BookingDocument = Booking;
