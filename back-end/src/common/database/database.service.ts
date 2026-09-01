import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// ENTITY INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface Region {
  region_id: string;
  region_name: string;
  is_active: boolean;
  created_at: string;
}

export interface SuperUser {
  super_user_id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
}

export interface RegionManager {
  rm_id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  region_id: string;
}

export interface ServiceProvider {
  sp_id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  dob: string;
  address: string;
  city: string;
  gender: string;
  rating: number;
  rating_count: number;
  is_active: boolean;
  account_status: string;
  deactivation_requested: boolean;
  hour_start: string;
  hour_end: string;
  created_at: string;
  updated_at: string;
  region_id?: string | null;
  service_category?: string;
  experience?: string;
}

export interface ProviderUnavailability {
  unavailability_id: string;
  date: string | null;
  hour_start: string;
  hour_end: string;
  reason: string;
  is_recurring: boolean;
  created_at: string;
  sp_id: string;
}

export interface Skill {
  skill_id: string;
  skill_name: string;
  description: string;
}

export interface ProviderSkill {
  sp_id: string;
  skill_id: string;
  verification_status: string;
  verified_at: string | null;
}

export interface Customer {
  customer_id: string;
  full_name: string;
  email: string;
  password_hash: string;
  phone: string;
  dob: string;
  address: string;
  city: string;
  rating: number;
  is_active: boolean;
}

export interface Cart {
  cart_id: string;
  service_address: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
}

export interface CartItem {
  cart_item_id: string;
  quantity: number;
  price_snapshot: number;
  added_at: string;
  cart_id: string;
  service_id: string;
  booking_type: 'INSTANT' | 'SCHEDULED';
  scheduled_at: string | null;
}

export interface Category {
  category_id: string;
  category_name: string;
  description: string;
  icon: string;
  image_url: string;
  average_rating: number;
  rating_count: number;
  is_available: boolean;
}

export interface Service {
  service_id: string;
  service_name: string;
  description: string;
  image_url?: string;
  photos: string[];
  base_price: number;
  estimated_duration_min: number;
  average_rating: number;
  rating_count: number;
  is_available: boolean;
  category_id: string;
}

export interface ServiceSkill {
  service_id: string;
  skill_id: string;
  is_required: boolean;
}

export interface HowItWorksItem {
  step_title: string;
  step_description: string;
}

export interface ServiceContent {
  service_id: string;
  how_it_works: HowItWorksItem[];
  what_is_covered: string[];
  what_is_not_covered: string[];
}

export interface ServiceFaq {
  faq_id: string;
  question: string;
  answer: string;
  display_order: number;
  service_id: string;
}

export interface Booking {
  booking_id: string;
  service_address: string;
  status: string;
  failure_reason: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  customer_id: string;
}

export interface BookingService {
  booking_id: string;
  service_id: string;
  quantity: number;
  price_at_booking: number;
  booking_type: 'INSTANT' | 'SCHEDULED';
  scheduled_at: string | null;
}

export interface JobAssignment {
  assignment_id: string;
  service_id: string;
  scheduled_date: string;
  hour_start: string;
  hour_end: string;
  status: string;
  assignment_score: number | null;
  notes: string | null;
  assigned_at: string;
  created_at: string;
  updated_at: string;
  booking_id: string;
  sp_id: string;
}

export interface Transaction {
  transaction_id: string;
  payment_gateway_ref: string;
  payment_method: string;
  idempotency_key: string;
  payment_status: string;
  amount: number;
  currency: string;
  refund_amount: number;
  refund_reason: string | null;
  transaction_at: string;
  verified_at: string | null;
  booking_id: string;
}

export interface RevenueLedger {
  ledger_id: string;
  payout_status: string;
  provider_amount: number;
  platform_amount: number;
  created_at: string;
  paid_at: string | null;
  booking_id: string;
  service_id: string;
  sp_id: string;
  rm_id: string;
}

export interface Review {
  review_id: string;
  rating: number;
  comment: string;
  created_at: string;
  booking_id: string;
  service_id: string;
  customer_id: string;
  sp_id: string;
}

export interface PlatformSetting {
  setting_id: string;
  key: string;
  value: string;
  description: string;
  updated_at: string;
  updated_by: string;
}

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly DB_PATH = path.join(process.cwd(), 'database.json');

  onModuleInit() {
    this.loadFromDisk();
  }

  save() {
    console.log('DatabaseService: Attempting to save to disk...');
    try {
      const data = {
        regions: this.regions,
        superUsers: this.superUsers,
        regionManagers: this.regionManagers,
        serviceProviders: this.serviceProviders,
        providerUnavailability: this.providerUnavailability,
        skills: this.skills,
        providerSkills: this.providerSkills,
        customers: this.customers,
        carts: this.carts,
        cartItems: this.cartItems,
        categories: this.categories,
        services: this.services,
        serviceSkills: this.serviceSkills,
        serviceContent: this.serviceContent,
        serviceFaqs: this.serviceFaqs,
        bookings: this.bookings,
        bookingServices: this.bookingServices,
        jobAssignments: this.jobAssignments,
        transactions: this.transactions,
        revenueLedger: this.revenueLedger,
        reviews: this.reviews,
        platformSettings: this.platformSettings,
      };
      fs.writeFileSync(this.DB_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Failed to save database to disk:', err);
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.DB_PATH)) {
        const raw = fs.readFileSync(this.DB_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (data.regions) this.regions = data.regions;
        if (data.superUsers) this.superUsers = data.superUsers;
        if (data.regionManagers) this.regionManagers = data.regionManagers;
        if (data.serviceProviders) this.serviceProviders = data.serviceProviders;
        if (data.providerUnavailability) this.providerUnavailability = data.providerUnavailability;
        if (data.skills) this.skills = data.skills;
        if (data.providerSkills) this.providerSkills = data.providerSkills;
        if (data.customers) this.customers = data.customers;
        if (data.carts) this.carts = data.carts;
        if (data.cartItems) this.cartItems = data.cartItems;
        if (data.categories) this.categories = data.categories;
        if (data.services) {
          this.services = data.services.map((s: any) => ({
            ...s,
            photos: Array.isArray(s.photos) ? s.photos : [],
          }));
        }
        if (data.serviceSkills) this.serviceSkills = data.serviceSkills;
        if (data.serviceContent) this.serviceContent = data.serviceContent;
        if (data.serviceFaqs) this.serviceFaqs = data.serviceFaqs;
        if (data.bookings) this.bookings = data.bookings;
        if (data.bookingServices) this.bookingServices = data.bookingServices;
        if (data.jobAssignments) this.jobAssignments = data.jobAssignments;
        if (data.transactions) this.transactions = data.transactions;
        if (data.revenueLedger) this.revenueLedger = data.revenueLedger;
        if (data.reviews) this.reviews = data.reviews;
        if (data.platformSettings) this.platformSettings = data.platformSettings;
        console.log('Database loaded from disk.');
      }
    } catch (err) {
      console.error('Failed to load database from disk:', err);
    }
  }

  regions: Region[] = [
    {
      region_id: 'b2b636cc-a295-445c-844f-eed968905d91',
      region_name: 'Chennai North',
      is_active: true,
      created_at: '2025-10-01T00:00:00Z',
    },
    {
      region_id: 'r2b636cc-a295-445c-844f-eed968905d92',
      region_name: 'Chennai South',
      is_active: true,
      created_at: '2025-10-01T00:00:00Z',
    },
    {
      region_id: 'r3b636cc-a295-445c-844f-eed968905d93',
      region_name: 'Trichy',
      is_active: true,
      created_at: '2025-10-01T00:00:00Z',
    },
  ];

  superUsers: SuperUser[] = [
    {
      super_user_id: '7de6c1ad-a059-462a-af39-dbaea975c3cf',
      name: 'Mark',
      email: 'super_user.mark@tatku.com',
      password_hash: this.storePassword('SuperUser@123'),
      phone: '9876543210',
      is_active: true,
      last_login: '2026-03-31T10:00:00Z',
      created_at: '2023-01-01T00:00:00Z',
    },
  ];

  regionManagers: RegionManager[] = [
    {
      rm_id: '895cfdc6-a51b-41f4-8a19-e14be2941c22',
      name: 'Suresh Patel',
      email: 'suresh@region.com',
      password_hash: this.storePassword('Password@123'),
      phone: '9988776655',
      is_active: true,
      created_at: '2024-10-10T00:00:00Z',
      updated_at: '2026-04-10T00:00:00Z',
      region_id: 'b2b636cc-a295-445c-844f-eed968905d91',
    },
  ];

  serviceProviders: ServiceProvider[] = [
    {
      sp_id: '89b3386b-aea4-4602-a2f8-1199b5c14303',
      name: 'Ravi Kumar',
      email: 'ravi.kumar@mail.com',
      password_hash: this.storePassword('Password@123'),
      phone: '9876543210',
      dob: '1990-04-12',
      address: '12 Anna Nagar, Chennai',
      city: 'Chennai',
      gender: 'Male',
      rating: 4.33,
      rating_count: 3,
      is_active: true,
      account_status: 'active',
      deactivation_requested: false,
      hour_start: '00:00',
      hour_end: '23:59',
      created_at: '2024-10-31T08:00:00Z',
      updated_at: '2026-04-10T11:30:00Z',
      region_id: 'b2b636cc-a295-445c-844f-eed968905d91',
    },
    {
      sp_id: '02ded170-f08e-4870-8877-83566238dad9',
      name: 'Manoj Selvam',
      email: 'manoj.selvam@mail.com',
      password_hash: this.storePassword('Password@123'),
      phone: '9884411223',
      dob: '1988-11-28',
      address: '22 Mogappair, Chennai',
      city: 'Chennai',
      gender: 'Male',
      rating: 5.0,
      rating_count: 2,
      is_active: true,
      account_status: 'active',
      deactivation_requested: false,
      hour_start: '00:00',
      hour_end: '23:59',
      created_at: '2024-11-22T08:00:00Z',
      updated_at: '2026-04-10T09:20:00Z',
      region_id: 'b2b636cc-a295-445c-844f-eed968905d91',
    },
  ];

  providerUnavailability: ProviderUnavailability[] = [];

  skills: Skill[] = [
    {
      skill_id: 'sk1',
      skill_name: 'Plumbing',
      description: 'Installation and repair of pipes, fixtures, fittings',
    },
    {
      skill_id: 'sk2',
      skill_name: 'Electrical',
      description: 'Electrical installation and repair',
    },
    {
      skill_id: 'sk3',
      skill_name: 'Cleaning',
      description: 'Professional home and office cleaning',
    },
    {
      skill_id: 'sk4',
      skill_name: 'AC Repair',
      description: 'Diagnostics and repair for split and window AC units',
    },
  ];

  providerSkills: ProviderSkill[] = [];
  customers: Customer[] = [];
  carts: Cart[] = [];
  cartItems: CartItem[] = [];
  categories: Category[] = [];
  services: Service[] = [];
  serviceSkills: ServiceSkill[] = [];
  serviceContent: ServiceContent[] = [];
  serviceFaqs: ServiceFaq[] = [];
  bookings: Booking[] = [];
  bookingServices: BookingService[] = [];
  jobAssignments: JobAssignment[] = [];
  transactions: Transaction[] = [];
  revenueLedger: RevenueLedger[] = [];
  reviews: Review[] = [];
  platformSettings: PlatformSetting[] = [];

  genId(): string {
    return randomUUID();
  }

  hashPassword(plainPassword: string): string {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(plainPassword, salt, 64).toString('hex');
    return `scrypt:${salt}:${derivedKey}`;
  }

  verifyPassword(plainPassword: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
    const [, salt, storedKey] = parts;
    const derivedKey = scryptSync(plainPassword, salt, 64).toString('hex');
    return timingSafeEqual(
      Buffer.from(derivedKey, 'hex'),
      Buffer.from(storedKey, 'hex'),
    );
  }

  storePassword(plainPassword: string): string {
    return this.hashPassword(plainPassword);
  }

  now(): string {
    const date = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    return istDate.toISOString().replace('Z', '');
  }
}
