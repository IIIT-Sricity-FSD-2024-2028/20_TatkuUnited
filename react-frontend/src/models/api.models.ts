export type {
  BookingOffer,
  BookingDocument,
  CategoryDocument,
  ManagerDocument,
  NotificationDocument,
  OrderDocument,
  RefundEntry,
  PaymentDocument,
  MatchWeights,
  PlatformSettingDocument,
  ProviderDocument,
  RegionDocument,
  ReviewDocument,
  HowItWorksStep,
  FaqItem,
  ServiceDocument,
  UnavailabilityDocument,
  CartItem,
  Cart,
  UserDocument,
  UserAddress,
  AddressSnapshot,
  GeoPoint as GeoLocationDto,
  AddressSnapshot as AddressSnapshotDto,
  HowItWorksStep as HowItWorksStepDto,
  FaqItem as FaqItemDto,
  Cart as BackendCart,
  BookingOffer as BookingOfferDto,
  Role as UserRole,
  PaymentStatus as OrderPaymentStatus,
  UserStatus,
  ProviderStatus,
  BookingStatus,
  PayoutStatus
} from '@/schema';
export type { RefundStatus, Gender, ManagerStatus, CancelledBy, PaymentStatus } from "@/schema";
import type {
  GeoPoint as GeoLocationDto,
  AddressSnapshot as AddressSnapshotDto,
  HowItWorksStep as HowItWorksStepDto,
  FaqItem as FaqItemDto,
  Role as UserRole,
  PaymentStatus as OrderPaymentStatus,
  UserStatus,
  ProviderStatus,
  BookingStatus,
  PayoutStatus
} from "@/schema";

/**
 * Request DTOs and compatibility exports for the backend-aligned schemas in @/schema.
 * All monetary values are in **paise** (1 INR = 100 paise).
 * Time fields (startTime, endTime, blockStartTime) are **minutes from midnight**.
 */

// ---------------------------------------------------------------------------
// Primitives & Shared Shapes
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export interface AddCartItemDto {
  service: string;
  scheduledDate: string;
  startTime: number;
  endTime: number;
  addressId?: string;
}


export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  status?: UserStatus;
  gender?: string;
  dob?: string;
}

export type UpdateUserDto = Partial<Omit<CreateUserDto, "password"> & { password?: string; status?: UserStatus }>;

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface CreateProviderDto {
  user: string;
  offeredServices: string[];
  experience: number;
  workHourStart: number;
  workHourEnd: number;
  workingDays: number[];
  location: GeoLocationDto;
  status?: ProviderStatus;
  razorpayAccountId?: string;
  region?: string;
}

export type UpdateProviderDto = Partial<CreateProviderDto>;

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------


export interface CreateManagerDto {
  user: string;
  salary: number;
  experience: number;
  location: GeoLocationDto;
}

export type UpdateManagerDto = Partial<{
  salary: number;
  experience: number;
  location: GeoLocationDto;
  status: string;
  razorpayAccountId: string;
}>;

// ---------------------------------------------------------------------------
// Region
// ---------------------------------------------------------------------------


export interface CreateRegionDto {
  name: string;
  manager: string;
  location: GeoLocationDto;
  isActive?: boolean;
}

export type UpdateRegionDto = Partial<CreateRegionDto>;

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------


export interface CreateCategoryDto {
  name: string;
  description: string;
  imageUrl: string;
  isActive?: boolean;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

// ---------------------------------------------------------------------------
// Service Catalog
// ---------------------------------------------------------------------------


export interface CreateServiceDto {
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  isActive?: boolean;
  imageUrls?: string[];
  whatIsCovered?: string[];
  whatIsNotCovered?: string[];
  howItWorks?: HowItWorksStepDto[];
  faq?: FaqItemDto[];
  reviewCount?: number;
  rating?: number;
}

export type UpdateServiceDto = Partial<CreateServiceDto>;

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------

export interface CreateOrderDto {
  customer: string;
  address: AddressSnapshotDto;
  totalAmount: number;
  expiresAt: string;
}

export type UpdateOrderDto = Partial<{
  paymentStatus: OrderPaymentStatus;
  payment: string;
}>;

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

export interface CreateBookingDto {
  service: string;
  provider?: string;
  customer: string;
  order: string;
  region: string;
  scheduledDate: string;
  startTime: number;
  endTime: number;
  blockStartTime: number;
  price: number;
  platformFeePercent: number;
  platformShare: number;
  providerShare: number;
}

export type UpdateBookingDto = Partial<{
  status: BookingStatus;
  provider: string;
  cancelledBy: string;
  cancelledReason: string;
  offerExpiresAt: string;
  payoutStatus: PayoutStatus;
  payoutAt: string;
}>;

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export interface CreatePaymentDto {
  order: string;
  totalAmount: number;
  razorpayOrderId: string;
  currency?: string;
}

export type UpdatePaymentDto = Partial<{
  razorpayPaymentId: string;
  razorpaySignature: string;
}>;

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------


export interface CreateReviewDto {
  booking: string;
  rating: number;
  provider: string;
  service: string;
  review?: string;
}

export type UpdateReviewDto = Partial<{
  rating: number;
  review: string;
}>;

// ---------------------------------------------------------------------------
// Unavailability
// ---------------------------------------------------------------------------


export interface CreateUnavailabilityDto {
  provider: string;
  date: string;
  startTime: number;
  endTime: number;
  reason?: string;
}

export type UpdateUnavailabilityDto = Partial<{
  date: string;
  startTime: number;
  endTime: number;
  reason: string;
}>;

// ---------------------------------------------------------------------------
// Platform Settings
// ---------------------------------------------------------------------------


export interface CreatePlatformSettingDto {
  platformFeePercent: number;
  maxAssignmentDistanceKm: number;
  slotIntervalMinutes: number;
  firstSlotStart: number;
  lastSlotStart: number;
  bookingWindowDays: number;
  minLeadMinutes: number;
  travelBufferMinutes: number;
  offerTimeoutMinutes?: number;
  maxOfferRounds?: number;
  offerBatchSize?: number;
  payoutHoldHours?: number;
  matchWeights?: Partial<import("@/schema").MatchWeights>;
}

export type UpdatePlatformSettingDto = Partial<CreatePlatformSettingDto>;
