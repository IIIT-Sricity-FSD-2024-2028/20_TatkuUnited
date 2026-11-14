/** Serialized counterpart of back-end/src/schema/manager.schema.ts. */
import type { User, BaseDocument, Reference, GeoPoint, ManagerStatus } from './index';

export interface Manager extends BaseDocument {
  user: Reference<User>;
  salary: number;
  razorpayAccountId: string | null;
  experience: number;
  location: GeoPoint;
  status: ManagerStatus;
}

export type ManagerDocument = Manager;
