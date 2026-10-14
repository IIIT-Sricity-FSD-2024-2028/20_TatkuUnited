/**
 * Shared TypeScript models derived from the Tatku United OpenAPI 3.0 / Swagger spec.
 * All monetary values are in **paise** (1 INR = 100 paise).
 * Time fields (startTime, endTime, blockStartTime) are **minutes from midnight**.
 */

// ---------------------------------------------------------------------------
// Primitives & Shared Shapes
// ---------------------------------------------------------------------------

export interface GeoLocationDto {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface AddressSnapshotDto {
  line: string;
  city: string;
  location: GeoLocationDto;
}

export interface HowItWorksStepDto {
  title: string;
  desc: string;
}

export interface FaqItemDto {
  question: string;
  answer: string;
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export type UserRole = "customer" | "provider" | "manager" | "admin";
export type UserStatus = "active" | "blocked";

export interface UserAddress {
  label: string;
  line: string;
  city: string;
  location: GeoLocationDto;
}

export interface CartItem {
  service: string | ServiceDocument;
  scheduledDate: string;
  startTime: number;
  endTime: number;
}

export interface BackendCart {
  address: string | null;
  items: CartItem[];
}

export interface AddCartItemDto {
  service: string;
  scheduledDate: string;
  startTime: number;
  endTime: number;
}

export interface UserDocument {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  gender?: string;
  dob?: string;
  addresses?: UserAddress[];
  cart?: CartItem[];
  cartAddress?: AddressSnapshotDto;
  createdAt: string;
  updatedAt: string;
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

export type ProviderStatus = "active" | "suspended" | "pending";

export interface ProviderDocument {
  _id: string;
  user: string | UserDocument;
  offeredServices: string[];
  experience: number;
  workHourStart: number;
  workHourEnd: number;
  workingDays: number[];
  location: GeoLocationDto;
  status: ProviderStatus;
  rating?: number;
  ratingCount?: number;
  razorpayAccountId?: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface ManagerDocument {
  _id: string;
  user: string | UserDocument;
  salary: number;
  experience: number;
  location: GeoLocationDto;
  status?: string;
  razorpayAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface RegionDocument {
  _id: string;
  name: string;
  manager: string | ManagerDocument;
  location: GeoLocationDto;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export interface CategoryDocument {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export interface ServiceDocument {
  _id: string;
  name: string;
  category: string | CategoryDocument;
  reviewCount?: number;
  rating?: number;
  description: string;
  price: number; // paise
  duration: number; // minutes
  isActive: boolean;
  imageUrls?: string[];
  whatIsCovered?: string[];
  whatIsNotCovered?: string[];
  howItWorks?: HowItWorksStepDto[];
  faq?: FaqItemDto[];
  createdAt: string;
  updatedAt: string;
}

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

export type OrderPaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderDocument {
  _id: string;
  customer: string | UserDocument;
  address: AddressSnapshotDto;
  totalAmount: number; // paise
  paymentStatus: OrderPaymentStatus;
  payment?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

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

export type BookingStatus =
  | "pending"
  | "awaiting_provider"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PayoutStatus = "pending" | "transferred" | "failed";

export interface BookingDocument {
  _id: string;
  service: string | ServiceDocument;
  provider: string | ProviderDocument;
  customer: string | UserDocument;
  order: string | OrderDocument;
  region: string | RegionDocument;
  scheduledDate: string;
  startTime: number; // minutes from midnight
  endTime: number;
  blockStartTime: number;
  price: number; // paise
  platformFeePercent: number;
  platformShare: number; // paise
  providerShare: number; // paise
  status: BookingStatus;
  cancelledBy?: string;
  cancelledReason?: string;
  offerExpiresAt?: string;
  payoutStatus?: PayoutStatus;
  payoutAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingDto {
  service: string;
  provider: string;
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

export type PaymentStatus = "created" | "captured" | "failed" | "refunded";

export interface PaymentDocument {
  _id: string;
  order: string | OrderDocument;
  totalAmount: number; // paise
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

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

export interface ReviewDocument {
  _id: string;
  booking: string | BookingDocument;
  rating: number; // 1-5
  review?: string;
  provider: string | ProviderDocument;
  service: string | ServiceDocument;
  createdAt: string;
  updatedAt: string;
}

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

export interface UnavailabilityDocument {
  _id: string;
  provider: string | ProviderDocument;
  date: string;
  startTime: number; // minutes from midnight
  endTime: number;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface PlatformSettingDocument {
  _id: string;
  platformFeePercent: number;
  maxAssignmentDistanceKm: number;
  slotIntervalMinutes: number;
  firstSlotStart: number; // minutes from midnight
  lastSlotStart: number;
  bookingWindowDays: number;
  minLeadMinutes: number;
  travelBufferMinutes: number;
  offerTimeoutMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformSettingDto {
  platformFeePercent: number;
  maxAssignmentDistanceKm: number;
  slotIntervalMinutes: number;
  firstSlotStart: number;
  lastSlotStart: number;
  bookingWindowDays: number;
  minLeadMinutes: number;
  travelBufferMinutes: number;
  offerTimeoutMinutes: number;
}

export type UpdatePlatformSettingDto = Partial<CreatePlatformSettingDto>;
