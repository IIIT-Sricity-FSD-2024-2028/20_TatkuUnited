/** Serialized counterpart of back-end/src/schema/region.schema.ts. */
import type { Manager, BaseDocument, Reference, GeoPoint } from './index';

export interface Region extends BaseDocument {
  name: string;
  manager: Reference<Manager>;
  location: GeoPoint;
  isActive: boolean;
}

export type RegionDocument = Region;
