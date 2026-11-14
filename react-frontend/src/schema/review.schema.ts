/** Serialized counterpart of back-end/src/schema/review.schema.ts. */
import type { Booking, Provider, Service, BaseDocument, Reference } from './index';

export interface Review extends BaseDocument {
  booking: Reference<Booking>;
  rating: number;
  review: string | null;
  provider: Reference<Provider>;
  service: Reference<Service>;
}

export type ReviewDocument = Review;
