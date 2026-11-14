/** Serialized counterpart of back-end/src/schema/provider.schema.ts. */
import type { Region, Service, User, BaseDocument, Reference, GeoPoint, ProviderStatus } from './index';

export interface Provider extends BaseDocument {
  user: Reference<User>;
  offeredServices: Reference<Service>[];
  experience: number;
  workHourStart: number;
  workHourEnd: number;
  workingDays: number[];
  location: GeoPoint;
  status: ProviderStatus;
  rating: number;
  ratingCount: number;
  region: Reference<Region> | null;
  razorpayAccountId: string | null;
}

export type ProviderDocument = Provider;
