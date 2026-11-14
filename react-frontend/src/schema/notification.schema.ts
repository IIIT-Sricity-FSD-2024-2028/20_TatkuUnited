/** Serialized counterpart of back-end/src/schema/notification.schema.ts. */
import type { Booking, User, BaseDocument, ISODateString, Reference } from './index';

export interface Notification extends BaseDocument {
  user: Reference<User>;
  type: string;
  booking: Reference<Booking> | null;
  message: string;
  readAt: ISODateString | null;
}

export type NotificationDocument = Notification;
