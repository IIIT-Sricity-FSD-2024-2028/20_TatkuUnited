/** Serialized counterpart of back-end/src/schema/unavailability.schema.ts. */
import type { Provider, BaseDocument, ISODateString, Reference } from './index';

export interface Unavailability extends BaseDocument {
  provider: Reference<Provider>;
  date: ISODateString;
  startTime: number;
  endTime: number;
  reason: string | null;
}

export type UnavailabilityDocument = Unavailability;
