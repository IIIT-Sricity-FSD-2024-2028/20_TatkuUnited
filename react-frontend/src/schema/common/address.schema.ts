/** Serialized counterpart of back-end/src/schema/common/address.schema.ts. */
import type { GeoPoint } from '../index';

export interface UserAddress {
  id: string;
  label: string;
  line: string;
  city: string;
  location: GeoPoint;
}

export interface AddressSnapshot {
  line: string;
  city: string;
  location: GeoPoint;
}
