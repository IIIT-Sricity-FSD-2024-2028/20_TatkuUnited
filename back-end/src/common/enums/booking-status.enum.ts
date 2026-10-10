export enum BookingStatus {
  PENDING = 'pending',
  AWAITING_PROVIDER = 'awaiting_provider',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CancelledBy {
  CUSTOMER = 'customer',
  PROVIDER = 'provider',
  MANAGER = 'manager',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

export enum PayoutStatus {
  PENDING = 'pending',
  PAID = 'paid',
}
