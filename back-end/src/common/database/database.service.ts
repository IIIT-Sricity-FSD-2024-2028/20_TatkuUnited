import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

// --- Entity interfaces (mirror your ER diagram exactly) ---

export interface Collective {
  collective_id: string;
  collective_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Sector {
  sector_id: string;
  sector_name: string;
  state: string;
  region: string;
  density_tier: string;
  is_active: boolean;
  collective_id: string;
}

export interface Unit {
  unit_id: string;
  unit_name: string;
  rating: number;
  rating_count: number;
  is_active: boolean;
  created_at: string;
  collective_id: string;
}

export interface SuperUser {
  super_user_id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  pfp_url: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
}

export interface CollectiveManager {
  cm_id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  pfp_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  collective_id: string;
}

export interface UnitManager {
  um_id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  pfp_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  unit_id: string;
}

export interface ServiceProvider {
  sp_id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  dob: string;
  address: string;
  pfp_url: string;
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
  unit_id: string;
  home_sector_id: string;
}

export interface ProviderUnavailability {
  unavailability_id: string;
  date: string;
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
  pfp_url: string;
  rating: number;
  is_active: boolean;
  home_sector_id: string;
}

export interface Cart {
  cart_id: string;
  booking_type: 'INSTANT' | 'SCHEDULED';
  scheduled_at: string | null;
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
  image_url: string;
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
}

export interface ServiceContent {
  service_id: string;
  how_it_works: { step_title: string; step_description: string }[];
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
  booking_type: 'INSTANT' | 'SCHEDULED';
  service_address: string;
  scheduled_at: string;
  status: string;
  failure_reason: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  customer_id: string;
  sector_id: string;
}

export interface BookingService {
  booking_id: string;
  service_id: string;
  quantity: number;
  price_at_booking: number;
}

export interface JobAssignment {
  assignment_id: string;
  scheduled_date: string;
  hour_start: string;
  hour_end: string;
  status: string;
  assignment_score: number;
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
  um_amount: number;
  cm_amount: number;
  platform_amount: number;
  created_at: string;
  paid_at: string | null;
  booking_id: string;
  sp_id: string;
  um_id: string;
  cm_id: string;
}

export interface Review {
  review_id: string;
  rating: number;
  comment: string;
  created_at: string;
  booking_id: string;
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

// --- Seed data (from your mock JSON) ---

@Injectable()
export class DatabaseService {
  collectives: Collective[] = [
    {
      collective_id: 'COL001',
      collective_name: 'North Chennai Collective',
      is_active: true,
      created_at: '2023-01-10T08:00:00Z',
    },
  ];

  sectors: Sector[] = [
    {
      sector_id: 'SEC001',
      sector_name: 'Downtown Core',
      state: 'Tamil Nadu',
      region: 'Central',
      density_tier: 'HIGH',
      is_active: true,
      collective_id: 'COL001',
    },
  ];

  units: Unit[] = [
    {
      unit_id: 'UNT001',
      unit_name: 'Electrical & AC Services',
      rating: 5,
      rating_count: 1,
      is_active: true,
      created_at: '2024-10-31T00:00:00Z',
      collective_id: 'COL001',
    },
  ];

  superUsers: SuperUser[] = [
    {
      super_user_id: 'SU001',
      name: 'Mark',
      email: 'super_user.mark@tatku.com',
      password_hash: 'SuperUser@123',
      phone: '9876543210',
      pfp_url: 'https://i.pravatar.cc/150?img=1',
      is_active: true,
      last_login: '2026-03-31T10:00:00Z',
      created_at: '2023-01-01T00:00:00Z',
    },
  ];

  collectiveManagers: CollectiveManager[] = [
    {
      cm_id: 'CM001',
      name: 'Suresh Patel',
      email: 'suresh@collective.com',
      password_hash: 'Password@123',
      phone: '9988776655',
      pfp_url: 'https://i.pravatar.cc/150?img=11',
      is_active: true,
      created_at: '2024-10-10T00:00:00Z',
      updated_at: '2025-09-30T00:00:00Z',
      collective_id: 'COL001',
    },
  ];

  unitManagers: UnitManager[] = [
    {
      um_id: 'UM001',
      name: 'Karan Mehta',
      email: 'karan.m@unit.com',
      password_hash: 'Password@123',
      phone: '9955443322',
      pfp_url: 'https://i.pravatar.cc/150?img=12',
      is_active: true,
      created_at: '2024-11-09T00:00:00Z',
      updated_at: '2025-09-30T00:00:00Z',
      unit_id: 'UNT001',
    },
  ];

  serviceProviders: ServiceProvider[] = [
    {
      sp_id: 'SP001',
      name: 'Ravi Kumar',
      email: 'ravi.kumar@mail.com',
      password_hash: 'Password@123',
      phone: '9876543210',
      dob: '1990-04-12',
      address: '12 Anna Nagar, Chennai',
      pfp_url: 'https://i.pravatar.cc/150?img=13',
      gender: 'Male',
      rating: 5,
      rating_count: 1,
      is_active: true,
      account_status: 'active',
      deactivation_requested: false,
      hour_start: '08:00',
      hour_end: '18:00',
      created_at: '2024-10-31T08:00:00Z',
      updated_at: '2026-03-15T10:30:00Z',
      unit_id: 'UNT001',
      home_sector_id: 'SEC001',
    },
  ];

  providerUnavailability: ProviderUnavailability[] = [
    {
      unavailability_id: 'UV001',
      date: '2026-04-05',
      hour_start: '08:00',
      hour_end: '12:00',
      reason: 'Medical leave',
      is_recurring: false,
      created_at: '2026-03-20T10:00:00Z',
      sp_id: 'SP001',
    },
  ];

  skills: Skill[] = [
    {
      skill_id: 'SKL001',
      skill_name: 'Plumbing',
      description: 'Installation and repair of pipes, fixtures, fittings',
    },
    {
      skill_id: 'SKL002',
      skill_name: 'Electrical',
      description: 'Electrical installation and repair',
    },
    {
      skill_id: 'SKL003',
      skill_name: 'Cleaning',
      description: 'Professional home and office cleaning',
    },
  ];

  providerSkills: ProviderSkill[] = [
    {
      sp_id: 'SP001',
      skill_id: 'SKL002',
      verification_status: 'Verified',
      verified_at: '2026-03-25T10:00:00Z',
    },
  ];

  customers: Customer[] = [
    {
      customer_id: 'CUS001',
      full_name: 'Aditya Verma',
      email: 'aditya.v@gmail.com',
      password_hash: 'Password@123',
      phone: '9812345678',
      dob: '1992-03-15',
      address: '14 Boat Club Road, Chennai',
      pfp_url: 'https://i.pravatar.cc/150?img=14',
      rating: 5,
      is_active: true,
      home_sector_id: 'SEC001',
    },
  ];

  carts: Cart[] = [];
  cartItems: CartItem[] = [];

  categories: Category[] = [
    {
      category_id: 'CAT001',
      category_name: 'Home Cleaning',
      description: 'All home cleaning services',
      icon: '🧹',
      image_url: 'https://placehold.co/400x200/4A90D9/white?text=Home+Cleaning',
      average_rating: 5.0,
      rating_count: 1,
      is_available: true,
    },
  ];

  services: Service[] = [
    {
      service_id: 'SVC001',
      service_name: 'Standard Home Clean',
      description: 'Complete standard clean for up to 3BHK homes.',
      image_url:
        'https://placehold.co/400x200/4A90D9/white?text=Standard+Clean',
      base_price: 499,
      estimated_duration_min: 120,
      average_rating: 5.0,
      rating_count: 1,
      is_available: true,
      category_id: 'CAT001',
    },
  ];

  serviceSkills: ServiceSkill[] = [
    { service_id: 'SVC001', skill_id: 'SKL003' },
  ];

  serviceContent: ServiceContent[] = [
    {
      service_id: 'SVC001',
      how_it_works: [
        {
          step_title: 'Pre-clean inspection',
          step_description:
            'The professional reviews room condition before starting.',
        },
        {
          step_title: 'Systematic cleaning',
          step_description: 'Dusting, sweeping, mopping done area by area.',
        },
        {
          step_title: 'Final walkthrough',
          step_description: 'Quality check performed with customer.',
        },
      ],
      what_is_covered: [
        'Dusting of furniture',
        'Sweeping and mopping',
        'Surface wipe-down',
      ],
      what_is_not_covered: ['Deep stain removal', 'Post-construction debris'],
    },
  ];

  serviceFaqs: ServiceFaq[] = [
    {
      faq_id: 'FAQ001',
      question: 'How long does a standard clean take?',
      answer: 'Typically 2 hours for a 2BHK flat.',
      display_order: 1,
      service_id: 'SVC001',
    },
  ];

  bookings: Booking[] = [
    {
      booking_id: 'BKG001',
      booking_type: 'INSTANT',
      service_address: '14 Boat Club Road, Chennai',
      scheduled_at: '2026-03-29T03:48:22Z',
      status: 'COMPLETED',
      failure_reason: null,
      is_active: true,
      created_at: '2026-03-29T03:18:22Z',
      updated_at: '2026-03-29T06:18:22Z',
      customer_id: 'CUS001',
      sector_id: 'SEC001',
    },
  ];

  bookingServices: BookingService[] = [
    {
      booking_id: 'BKG001',
      service_id: 'SVC001',
      quantity: 1,
      price_at_booking: 499,
    },
  ];

  jobAssignments: JobAssignment[] = [
    {
      assignment_id: 'JA001',
      scheduled_date: '2026-03-31',
      hour_start: '10:00',
      hour_end: '12:00',
      status: 'COMPLETED',
      assignment_score: 5,
      notes: null,
      assigned_at: '2026-03-29T03:23:22Z',
      created_at: '2026-03-29T03:23:22Z',
      updated_at: '2026-03-29T06:18:22Z',
      booking_id: 'BKG001',
      sp_id: 'SP001',
    },
  ];

  transactions: Transaction[] = [
    {
      transaction_id: 'TXN001',
      payment_gateway_ref: 'PGR20240701001',
      payment_method: 'UPI',
      idempotency_key: 'idem-bkg001-001',
      payment_status: 'SUCCESS',
      amount: 1999,
      currency: 'INR',
      refund_amount: 0,
      refund_reason: null,
      transaction_at: '2026-03-29T03:20:22Z',
      verified_at: '2026-03-29T03:21:00Z',
      booking_id: 'BKG001',
    },
  ];

  revenueLedger: RevenueLedger[] = [];
  reviews: Review[] = [];

  platformSettings: PlatformSetting[] = [
    {
      setting_id: 'PS001',
      key: 'max_booking_window_days',
      value: '30',
      description: 'Max days ahead a customer can schedule',
      updated_at: new Date().toISOString(),
      updated_by: 'SU001',
    },
    {
      setting_id: 'PS002',
      key: 'maintenance_mode',
      value: 'false',
      description: 'Platform maintenance mode toggle',
      updated_at: new Date().toISOString(),
      updated_by: 'SU001',
    },
  ];

  genId(): string {
    return uuid();
  }

  now(): string {
    return new Date().toISOString();
  }
}
