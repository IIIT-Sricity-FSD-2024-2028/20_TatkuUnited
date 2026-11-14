/** Serialized counterpart of back-end/src/schema/user.schema.ts. */
import type { Service, UserAddress, BaseDocument, ISODateString, Reference, Role, UserStatus, Gender } from './index';

export interface CartItem {
  service: Reference<Service>;
  scheduledDate: ISODateString;
  startTime: number;
  endTime: number;
}

export interface Cart {
  address: string | null;
  items: CartItem[];
}

export interface User extends BaseDocument {
  name: string;
  email: string;
  gender?: Gender;
  phone: string;
  dob?: ISODateString;
  role: Role;
  status: UserStatus;
  cart: Cart;
  addresses: UserAddress[];
}

export type UserDocument = User;
