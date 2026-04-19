import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// ENTITY INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

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
  rating: number;
  is_active: boolean;
  home_sector_id: string;
}

// Cart exists only while the customer is browsing / has not checked out.
// Once the customer pays, the cart row is deleted. No is_checked_out flag needed.
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

// Each line item in a booking gets its own assignment and its own provider.
// This mirrors Urban Company's model: one job assignment per service per booking.
// A customer reviewing after completion gets one review prompt per service,
// not one review for the whole booking.
export interface JobAssignment {
  assignment_id: string;
  service_id: string; // which service this assignment is for
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

// Review is per service per booking — not per booking as a whole.
// After all jobs in a booking are COMPLETED the customer receives one review
// prompt per service (identical to Urban Company's post-job review flow).
// rating here = the assignment_score on the corresponding JobAssignment row.
export interface Review {
  review_id: string;
  rating: number;
  comment: string;
  created_at: string;
  booking_id: string;
  service_id: string; // which service this review is for
  customer_id: string;
  sp_id: string; // which provider delivered this service
}

export interface PlatformSetting {
  setting_id: string;
  key: string;
  value: string;
  description: string;
  updated_at: string;
  updated_by: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
//
// Rating derivation (all averages computed from actual review/assignment data):
//
//   serviceProviders[0]  Ravi Kumar
//     booking[0] → Split AC Repair       → score 5
//     booking[2] → Standard Home Clean   → score 4
//     booking[3] → Split AC Repair       → score 4  (multi-service booking)
//     avg = (5+4+4)/3 = 4.33, count = 3
//
//   serviceProviders[1]  Manoj Selvam
//     booking[1] → Kitchen Sink Leak Fix → score 5
//     booking[3] → Kitchen Sink Leak Fix → score 5  (multi-service booking)
//     avg = (5+5)/2 = 5.0, count = 2
//
//   serviceProviders[2]  Priya Nair
//     no completed jobs → rating 0, count 0
//
//   services[0]  Standard Home Clean
//     booking[2] review → rating 4
//     avg = 4.0, count = 1
//
//   services[2]  Split AC Repair
//     booking[0] review → rating 5
//     booking[3] review → rating 4
//     avg = (5+4)/2 = 4.5, count = 2
//
//   services[3]  Kitchen Sink Leak Fix
//     booking[1] review → rating 5
//     booking[3] review → rating 5
//     avg = (5+5)/2 = 5.0, count = 2
//
//   categories[1]  Appliance Repair  (contains services[2])
//     avg = 4.5, count = 2
//
//   categories[2]  Plumbing  (contains services[3])
//     avg = 5.0, count = 2
//
//   categories[0]  Home Cleaning  (contains services[0])
//     avg = 4.0, count = 1
//
//   Revenue ledger split:  SP 78% | UM 8% | CM 4% | Platform 10%
//
//   booking[3] is the multi-service booking (AC Repair ₹1299 + Plumbing ₹699 = ₹1998 total).
//   It has TWO job assignments (one per service) and TWO reviews (one per service).
//   The single transaction covers the full ₹1998.
//   The revenue ledger has TWO rows — one per service/provider, each calculated
//   on that service's price_at_booking, not the booking total.
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class DatabaseService {
  collectives: Collective[] = [
    {
      collective_id: this.genId(),
      collective_name: 'North Chennai Collective',
      is_active: true,
      created_at: '2025-10-01T00:00:00Z',
    },
  ];

  sectors: Sector[] = [
    {
      sector_id: this.genId(),
      sector_name: 'Downtown Core',
      state: 'Tamil Nadu',
      region: 'Central',
      density_tier: 'HIGH',
      is_active: true,
      collective_id: this.collectives[0].collective_id,
    },
    {
      sector_id: this.genId(),
      sector_name: 'Anna Nagar West',
      state: 'Tamil Nadu',
      region: 'North',
      density_tier: 'MEDIUM',
      is_active: true,
      collective_id: this.collectives[0].collective_id,
    },
    {
      sector_id: this.genId(),
      sector_name: 'Velachery South',
      state: 'Tamil Nadu',
      region: 'South',
      density_tier: 'HIGH',
      is_active: true,
      collective_id: this.collectives[0].collective_id,
    },
  ];

  units: Unit[] = [
    {
      unit_id: this.genId(), // units[0] – Electrical & AC
      unit_name: 'Electrical & AC Services',
      // Ravi has 3 reviewed jobs (scores 5,4,4) → unit avg = (5+4+4)/3 = 4.33
      rating: 4.33,
      rating_count: 3,
      is_active: true,
      created_at: '2025-10-31T00:00:00Z',
      collective_id: this.collectives[0].collective_id,
    },
    {
      unit_id: this.genId(), // units[1] – Plumbing
      unit_name: 'Plumbing & Sanitary Services',
      // Manoj has 2 reviewed jobs (scores 5,5) → unit avg = 5.0
      rating: 5.0,
      rating_count: 2,
      is_active: true,
      created_at: '2025-11-20T00:00:00Z',
      collective_id: this.collectives[0].collective_id,
    },
  ];

  superUsers: SuperUser[] = [
    {
      super_user_id: this.genId(),
      name: 'Mark',
      email: 'super_user.mark@tatku.com',
      password_hash: this.storePassword('SuperUser@123'),
      phone: '9876543210',
      is_active: true,
      last_login: '2026-03-31T10:00:00Z',
      created_at: '2023-01-01T00:00:00Z',
    },
  ];

  collectiveManagers: CollectiveManager[] = [
    {
      cm_id: this.genId(),
      name: 'Suresh Patel',
      email: 'suresh@collective.com',
      password_hash: this.storePassword('Password@123'),
      phone: '9988776655',
      is_active: true,
      created_at: '2024-10-10T00:00:00Z',
      updated_at: '2026-04-10T00:00:00Z',
      collective_id: this.collectives[0].collective_id,
    },
  ];

  unitManagers: UnitManager[] = [
    {
      um_id: this.genId(), // unitManagers[0] – manages units[0]
      name: 'Karan Mehta',
      email: 'karan.m@unit.com',
      password_hash: this.storePassword('Password@123'),
      phone: '9955443322',
      is_active: true,
      created_at: '2024-11-09T00:00:00Z',
      updated_at: '2026-04-10T00:00:00Z',
      unit_id: this.units[0].unit_id,
    },
    {
      um_id: this.genId(), // unitManagers[1] – manages units[1]
      name: 'Naveen Raj',
      email: 'naveen.r@unit.com',
      password_hash: this.storePassword('Password@123'),
      phone: '9930012277',
      is_active: true,
      created_at: '2024-12-05T00:00:00Z',
      updated_at: '2026-04-09T00:00:00Z',
      unit_id: this.units[1].unit_id,
    },
  ];

  serviceProviders: ServiceProvider[] = [
    {
      sp_id: this.genId(), // serviceProviders[0] – Ravi Kumar, AC unit
      name: 'Ravi Kumar',
      email: 'ravi.kumar@mail.com',
      password_hash: this.storePassword('Password@123'),
      phone: '9876543210',
      dob: '1990-04-12',
      address: '12 Anna Nagar, Chennai',
      gender: 'Male',
      // Jobs scored: 5 (booking[0]), 4 (booking[2]), 4 (booking[3] AC line)
      // avg = (5+4+4)/3 = 4.33
      rating: 4.33,
      rating_count: 3,
      is_active: true,
      account_status: 'active',
      deactivation_requested: false,
      hour_start: '08:00',
      hour_end: '18:00',
      created_at: '2024-10-31T08:00:00Z',
      updated_at: '2026-04-10T11:30:00Z',
      unit_id: this.units[0].unit_id,
      home_sector_id: this.sectors[0].sector_id,
    },
    {
      sp_id: this.genId(), // serviceProviders[1] – Manoj Selvam, Plumbing unit
      name: 'Manoj Selvam',
      email: 'manoj.selvam@mail.com',
      password_hash: this.storePassword('Password@123'),
      phone: '9884411223',
      dob: '1988-11-28',
      address: '22 Mogappair, Chennai',
      gender: 'Male',
      // Jobs scored: 5 (booking[1]), 5 (booking[3] plumbing line)
      // avg = (5+5)/2 = 5.0
      rating: 5.0,
      rating_count: 2,
      is_active: true,
      account_status: 'active',
      deactivation_requested: false,
      hour_start: '09:00',
      hour_end: '18:00',
      created_at: '2024-11-22T08:00:00Z',
      updated_at: '2026-04-10T09:20:00Z',
      unit_id: this.units[1].unit_id,
      home_sector_id: this.sectors[1].sector_id,
    },
    {
      sp_id: this.genId(), // serviceProviders[2] – Priya Nair, AC unit, no jobs yet
      name: 'Priya Nair',
      email: 'priya.nair@mail.com',
      password_hash: this.storePassword('Password@123'),
      phone: '9841015512',
      dob: '1994-02-10',
      address: '18 Velachery, Chennai',
      gender: 'Female',
      rating: 0,
      rating_count: 0,
      is_active: true,
      account_status: 'active',
      deactivation_requested: false,
      hour_start: '08:00',
      hour_end: '17:00',
      created_at: '2025-01-06T08:00:00Z',
      updated_at: '2026-04-01T10:00:00Z',
      unit_id: this.units[0].unit_id,
      home_sector_id: this.sectors[2].sector_id,
    },
  ];

  providerUnavailability: ProviderUnavailability[] = [
    {
      unavailability_id: this.genId(),
      date: '2026-04-05',
      hour_start: '08:00',
      hour_end: '12:00',
      reason: 'Medical leave',
      is_recurring: false,
      created_at: '2026-03-20T10:00:00Z',
      sp_id: this.serviceProviders[0].sp_id,
    },
    {
      unavailability_id: this.genId(),
      date: '2026-04-06',
      hour_start: '14:00',
      hour_end: '18:00',
      reason: 'Family event',
      is_recurring: false,
      created_at: '2026-03-25T11:30:00Z',
      sp_id: this.serviceProviders[1].sp_id,
    },
  ];

  skills: Skill[] = [
    {
      skill_id: this.genId(), // skills[0] – Plumbing
      skill_name: 'Plumbing',
      description: 'Installation and repair of pipes, fixtures, fittings',
    },
    {
      skill_id: this.genId(), // skills[1] – Electrical
      skill_name: 'Electrical',
      description: 'Electrical installation and repair',
    },
    {
      skill_id: this.genId(), // skills[2] – Cleaning
      skill_name: 'Cleaning',
      description: 'Professional home and office cleaning',
    },
    {
      skill_id: this.genId(), // skills[3] – AC Repair
      skill_name: 'AC Repair',
      description: 'Diagnostics and repair for split and window AC units',
    },
  ];

  providerSkills: ProviderSkill[] = [
    {
      sp_id: this.serviceProviders[0].sp_id,
      skill_id: this.skills[1].skill_id, // Ravi → Electrical
      verification_status: 'Verified',
      verified_at: '2026-03-25T10:00:00Z',
    },
    {
      sp_id: this.serviceProviders[0].sp_id,
      skill_id: this.skills[3].skill_id, // Ravi → AC Repair
      verification_status: 'Verified',
      verified_at: '2026-03-25T10:05:00Z',
    },
    {
      sp_id: this.serviceProviders[0].sp_id,
      skill_id: this.skills[2].skill_id, // Ravi → Cleaning
      verification_status: 'Verified',
      verified_at: '2026-03-26T09:00:00Z',
    },
    {
      sp_id: this.serviceProviders[1].sp_id,
      skill_id: this.skills[0].skill_id, // Manoj → Plumbing
      verification_status: 'Verified',
      verified_at: '2026-03-26T09:30:00Z',
    },
    {
      sp_id: this.serviceProviders[2].sp_id,
      skill_id: this.skills[2].skill_id, // Priya → Cleaning
      verification_status: 'Verified',
      verified_at: '2026-03-28T12:00:00Z',
    },
  ];

  customers: Customer[] = [
    {
      customer_id: this.genId(), // customers[0] – Aditya
      full_name: 'Aditya Verma',
      email: 'aditya.v@gmail.com',
      password_hash: this.storePassword('Password@123'),
      phone: '9812345678',
      dob: '1992-03-15',
      address: '14 Boat Club Road, Chennai',
      rating: 0,
      is_active: true,
      home_sector_id: this.sectors[0].sector_id,
    },
    {
      customer_id: this.genId(), // customers[1] – Lakshmi
      full_name: 'Lakshmi Iyer',
      email: 'lakshmi.iyer@gmail.com',
      password_hash: this.storePassword('Password@123'),
      phone: '9894098765',
      dob: '1995-07-09',
      address: '33 Anna Nagar, Chennai',
      rating: 0,
      is_active: true,
      home_sector_id: this.sectors[1].sector_id,
    },
    {
      customer_id: this.genId(), // customers[2] – Arjun
      full_name: 'Arjun N',
      email: 'arjun.n@gmail.com',
      password_hash: this.storePassword('Password@123'),
      phone: '9900023456',
      dob: '1998-01-18',
      address: '77 Velachery Main Road, Chennai',
      rating: 0,
      is_active: true,
      home_sector_id: this.sectors[2].sector_id,
    },
  ];

  // Carts are deleted on checkout. Only open/in-progress carts exist here.
  // All three customers have completed bookings so their checkout carts are gone.
  // No open carts in seed — represents a clean state after all past orders.
  carts: Cart[] = [];
  cartItems: CartItem[] = [];

  categories: Category[] = [
    {
      category_id: this.genId(), // categories[0] – Home Cleaning
      category_name: 'Home Cleaning',
      description: 'All home cleaning services',
      icon: '🧹',
      image_url: 'https://placehold.co/400x200/4A90D9/white?text=Home+Cleaning',
      // services[0] Standard Home Clean: 1 review, rating 4 → avg 4.0
      average_rating: 4.0,
      rating_count: 1,
      is_available: true,
    },
    {
      category_id: this.genId(), // categories[1] – Appliance Repair
      category_name: 'Appliance Repair',
      description: 'Appliance diagnostics and repair services',
      icon: '🛠️',
      image_url:
        'https://placehold.co/400x200/2D9CDB/white?text=Appliance+Repair',
      // services[2] Split AC Repair: 2 reviews (5,4) → avg 4.5
      average_rating: 4.5,
      rating_count: 2,
      is_available: true,
    },
    {
      category_id: this.genId(), // categories[2] – Plumbing
      category_name: 'Plumbing',
      description: 'Leak fixing, fittings, and sanitary service work',
      icon: '🚰',
      image_url: 'https://placehold.co/400x200/1E8E3E/white?text=Plumbing',
      // services[3] Kitchen Sink Leak Fix: 2 reviews (5,5) → avg 5.0
      average_rating: 5.0,
      rating_count: 2,
      is_available: true,
    },
  ];

  services: Service[] = [
    {
      service_id: this.genId(), // services[0] – Standard Home Clean
      service_name: 'Standard Home Clean',
      description: 'Complete standard clean for up to 3BHK homes.',
      image_url:
        'https://placehold.co/400x200/4A90D9/white?text=Standard+Clean',
      base_price: 499,
      estimated_duration_min: 120,
      // 1 review from booking[2], rating 4 → avg 4.0
      average_rating: 4.0,
      rating_count: 1,
      is_available: true,
      category_id: this.categories[0].category_id,
    },
    {
      service_id: this.genId(), // services[1] – Deep Home Clean
      service_name: 'Deep Home Clean',
      description: 'Deep cleaning for kitchen, bathrooms, and living areas.',
      image_url: 'https://placehold.co/400x200/4A90D9/white?text=Deep+Clean',
      base_price: 899,
      estimated_duration_min: 180,
      average_rating: 0,
      rating_count: 0,
      is_available: true,
      category_id: this.categories[0].category_id,
    },
    {
      service_id: this.genId(), // services[2] – Split AC Repair
      service_name: 'Split AC Repair',
      description: 'Inspection and repair for common split AC faults.',
      image_url: 'https://placehold.co/400x200/2D9CDB/white?text=AC+Repair',
      base_price: 1299,
      estimated_duration_min: 90,
      // Reviews: booking[0] rating 5, booking[3] rating 4 → avg (5+4)/2 = 4.5
      average_rating: 4.5,
      rating_count: 2,
      is_available: true,
      category_id: this.categories[1].category_id,
    },
    {
      service_id: this.genId(), // services[3] – Kitchen Sink Leak Fix
      service_name: 'Kitchen Sink Leak Fix',
      description: 'Leak detection and repair for kitchen sink pipelines.',
      image_url: 'https://placehold.co/400x200/1E8E3E/white?text=Leak+Fix',
      base_price: 699,
      estimated_duration_min: 75,
      // Reviews: booking[1] rating 5, booking[3] rating 5 → avg 5.0
      average_rating: 5.0,
      rating_count: 2,
      is_available: true,
      category_id: this.categories[2].category_id,
    },
  ];

  serviceSkills: ServiceSkill[] = [
    {
      service_id: this.services[0].service_id,
      skill_id: this.skills[2].skill_id,
    }, // Clean → Cleaning
    {
      service_id: this.services[1].service_id,
      skill_id: this.skills[2].skill_id,
    }, // Deep Clean → Cleaning
    {
      service_id: this.services[2].service_id,
      skill_id: this.skills[3].skill_id,
    }, // AC Repair → AC Repair
    {
      service_id: this.services[2].service_id,
      skill_id: this.skills[1].skill_id,
    }, // AC Repair → Electrical
    {
      service_id: this.services[3].service_id,
      skill_id: this.skills[0].skill_id,
    }, // Leak Fix → Plumbing
  ];

  serviceContent: ServiceContent[] = [
    {
      service_id: this.services[0].service_id,
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
    {
      service_id: this.services[1].service_id,
      how_it_works: [
        {
          step_title: 'Area assessment',
          step_description: 'Professional assesses deep cleaning requirement.',
        },
        {
          step_title: 'Deep cleaning pass',
          step_description: 'High-touch and difficult areas are deep cleaned.',
        },
        {
          step_title: 'Final sanitization',
          step_description: 'Final sanitization and completion check.',
        },
      ],
      what_is_covered: [
        'Kitchen degreasing',
        'Bathroom descaling',
        'Floor scrubbing',
      ],
      what_is_not_covered: ['Pest control', 'Wall repainting'],
    },
    {
      service_id: this.services[2].service_id,
      how_it_works: [
        {
          step_title: 'Fault diagnosis',
          step_description: 'Technician checks electrical and cooling issues.',
        },
        {
          step_title: 'Repair and replacement',
          step_description: 'Required components are repaired or replaced.',
        },
        {
          step_title: 'Cooling performance test',
          step_description: 'Post-repair cooling benchmark is verified.',
        },
      ],
      what_is_covered: [
        'Basic electrical checks',
        'Gas pressure check',
        'Minor part replacement',
      ],
      what_is_not_covered: [
        'Compressor replacement cost',
        'External carpentry work',
      ],
    },
    {
      service_id: this.services[3].service_id,
      how_it_works: [
        {
          step_title: 'Leak point tracing',
          step_description: 'Plumber traces source of the leak.',
        },
        {
          step_title: 'Seal/fitting correction',
          step_description: 'Faulty joints and fittings are corrected.',
        },
        {
          step_title: 'Flow test',
          step_description: 'Post-fix flow and leak test are performed.',
        },
      ],
      what_is_covered: [
        'Leak tracing',
        'Seal replacement',
        'Pipe joint tightening',
      ],
      what_is_not_covered: ['Full pipeline relaying', 'Civil wall repair'],
    },
  ];

  serviceFaqs: ServiceFaq[] = [
    {
      faq_id: this.genId(),
      question: 'How long does a standard clean take?',
      answer: 'Typically 2 hours for a 2BHK flat.',
      display_order: 1,
      service_id: this.services[0].service_id,
    },
    {
      faq_id: this.genId(),
      question: 'Do I need to provide any cleaning materials?',
      answer: 'No, the professional carries standard supplies and tools.',
      display_order: 1,
      service_id: this.services[1].service_id,
    },
    {
      faq_id: this.genId(),
      question: 'Is gas refill included in AC repair?',
      answer: 'Gas refill is charged separately if required after diagnosis.',
      display_order: 1,
      service_id: this.services[2].service_id,
    },
    {
      faq_id: this.genId(),
      question: 'Can this service fix concealed pipe leakage?',
      answer: 'Only exposed and accessible leak points are covered.',
      display_order: 1,
      service_id: this.services[3].service_id,
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // BOOKINGS
  //
  //  booking[0]  Aditya   – INSTANT   – Split AC Repair             – COMPLETED
  //  booking[1]  Lakshmi  – SCHEDULED – Kitchen Sink Leak Fix       – COMPLETED
  //  booking[2]  Arjun    – SCHEDULED – Standard Home Clean         – COMPLETED
  //  booking[3]  Aditya   – SCHEDULED – Split AC Repair + Leak Fix  – COMPLETED
  //                         (multi-service booking — the key example)
  //  booking[4]  Aditya   – SCHEDULED – Deep Home Clean             – CANCELLED
  // ─────────────────────────────────────────────────────────────────────────

  bookings: Booking[] = [
    {
      booking_id: this.genId(), // bookings[0]
      booking_type: 'INSTANT',
      service_address: '14 Boat Club Road, Chennai',
      scheduled_at: '2026-03-29T03:48:22Z',
      status: 'COMPLETED',
      failure_reason: null,
      is_active: true,
      created_at: '2026-03-29T03:18:22Z',
      updated_at: '2026-03-29T06:18:22Z',
      customer_id: this.customers[0].customer_id,
      sector_id: this.sectors[0].sector_id,
    },
    {
      booking_id: this.genId(), // bookings[1]
      booking_type: 'SCHEDULED',
      service_address: '33 Anna Nagar, Chennai',
      scheduled_at: '2026-04-02T09:00:00Z',
      status: 'COMPLETED',
      failure_reason: null,
      is_active: true,
      created_at: '2026-04-01T16:30:00Z',
      updated_at: '2026-04-02T10:40:00Z',
      customer_id: this.customers[1].customer_id,
      sector_id: this.sectors[1].sector_id,
    },
    {
      booking_id: this.genId(), // bookings[2]
      booking_type: 'SCHEDULED',
      service_address: '77 Velachery Main Road, Chennai',
      scheduled_at: '2026-04-03T12:00:00Z',
      status: 'COMPLETED',
      failure_reason: null,
      is_active: true,
      created_at: '2026-04-02T08:10:00Z',
      updated_at: '2026-04-03T14:20:00Z',
      customer_id: this.customers[2].customer_id,
      sector_id: this.sectors[2].sector_id,
    },
    {
      booking_id: this.genId(), // bookings[3] – multi-service booking
      booking_type: 'SCHEDULED',
      service_address: '14 Boat Club Road, Chennai',
      scheduled_at: '2026-04-07T09:00:00Z',
      status: 'COMPLETED',
      failure_reason: null,
      is_active: true,
      created_at: '2026-04-05T11:00:00Z',
      updated_at: '2026-04-07T12:30:00Z',
      customer_id: this.customers[0].customer_id,
      sector_id: this.sectors[0].sector_id,
    },
    {
      booking_id: this.genId(), // bookings[4] – cancelled
      booking_type: 'SCHEDULED',
      service_address: '14 Boat Club Road, Chennai',
      scheduled_at: '2026-04-10T11:00:00Z',
      status: 'CANCELLED',
      failure_reason: 'Customer cancelled before assignment',
      is_active: false,
      created_at: '2026-04-08T09:15:00Z',
      updated_at: '2026-04-08T10:00:00Z',
      customer_id: this.customers[0].customer_id,
      sector_id: this.sectors[0].sector_id,
    },
  ];

  bookingServices: BookingService[] = [
    // booking[0] – single service
    {
      booking_id: this.bookings[0].booking_id,
      service_id: this.services[2].service_id,
      quantity: 1,
      price_at_booking: 1299,
    },
    // booking[1] – single service
    {
      booking_id: this.bookings[1].booking_id,
      service_id: this.services[3].service_id,
      quantity: 1,
      price_at_booking: 699,
    },
    // booking[2] – single service
    {
      booking_id: this.bookings[2].booking_id,
      service_id: this.services[0].service_id,
      quantity: 1,
      price_at_booking: 499,
    },
    // booking[3] – TWO services in one booking
    {
      booking_id: this.bookings[3].booking_id,
      service_id: this.services[2].service_id, // Split AC Repair
      quantity: 1,
      price_at_booking: 1299,
    },
    {
      booking_id: this.bookings[3].booking_id,
      service_id: this.services[3].service_id, // Kitchen Sink Leak Fix
      quantity: 1,
      price_at_booking: 699,
    },
    // booking[4] – cancelled, service line kept for record
    {
      booking_id: this.bookings[4].booking_id,
      service_id: this.services[1].service_id,
      quantity: 1,
      price_at_booking: 899,
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // JOB ASSIGNMENTS
  //
  // One assignment per service per booking (Urban Company model).
  // booking[3] has TWO assignments — one for AC Repair (Ravi), one for
  // Leak Fix (Manoj). They can be scheduled at different times on the same day.
  // booking[4] was cancelled before any assignment was created.
  // ─────────────────────────────────────────────────────────────────────────

  jobAssignments: JobAssignment[] = [
    {
      assignment_id: this.genId(),
      service_id: this.services[2].service_id, // Split AC Repair
      scheduled_date: '2026-03-29',
      hour_start: '09:00',
      hour_end: '10:30',
      status: 'COMPLETED',
      assignment_score: 5,
      notes: null,
      assigned_at: '2026-03-29T03:23:22Z',
      created_at: '2026-03-29T03:23:22Z',
      updated_at: '2026-03-29T06:18:22Z',
      booking_id: this.bookings[0].booking_id,
      sp_id: this.serviceProviders[0].sp_id, // Ravi
    },
    {
      assignment_id: this.genId(),
      service_id: this.services[3].service_id, // Kitchen Sink Leak Fix
      scheduled_date: '2026-04-02',
      hour_start: '09:00',
      hour_end: '10:15',
      status: 'COMPLETED',
      assignment_score: 5,
      notes: null,
      assigned_at: '2026-04-01T16:36:00Z',
      created_at: '2026-04-01T16:36:00Z',
      updated_at: '2026-04-02T10:40:00Z',
      booking_id: this.bookings[1].booking_id,
      sp_id: this.serviceProviders[1].sp_id, // Manoj
    },
    {
      assignment_id: this.genId(),
      service_id: this.services[0].service_id, // Standard Home Clean
      scheduled_date: '2026-04-03',
      hour_start: '12:00',
      hour_end: '14:00',
      status: 'COMPLETED',
      assignment_score: 4,
      notes: null,
      assigned_at: '2026-04-02T08:15:00Z',
      created_at: '2026-04-02T08:15:00Z',
      updated_at: '2026-04-03T14:20:00Z',
      booking_id: this.bookings[2].booking_id,
      sp_id: this.serviceProviders[0].sp_id, // Ravi
    },
    // booking[3] – AC Repair line → Ravi
    {
      assignment_id: this.genId(),
      service_id: this.services[2].service_id, // Split AC Repair
      scheduled_date: '2026-04-07',
      hour_start: '09:00',
      hour_end: '10:30',
      status: 'COMPLETED',
      assignment_score: 4,
      notes: null,
      assigned_at: '2026-04-05T11:05:00Z',
      created_at: '2026-04-05T11:05:00Z',
      updated_at: '2026-04-07T10:35:00Z',
      booking_id: this.bookings[3].booking_id,
      sp_id: this.serviceProviders[0].sp_id, // Ravi
    },
    // booking[3] – Leak Fix line → Manoj (scheduled after AC job on the same day)
    {
      assignment_id: this.genId(),
      service_id: this.services[3].service_id, // Kitchen Sink Leak Fix
      scheduled_date: '2026-04-07',
      hour_start: '11:00',
      hour_end: '12:15',
      status: 'COMPLETED',
      assignment_score: 5,
      notes: null,
      assigned_at: '2026-04-05T11:05:00Z',
      created_at: '2026-04-05T11:05:00Z',
      updated_at: '2026-04-07T12:30:00Z',
      booking_id: this.bookings[3].booking_id,
      sp_id: this.serviceProviders[1].sp_id, // Manoj
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // TRANSACTIONS
  //
  // One transaction per booking (the customer pays for the whole cart at once).
  // booking[3] has two services but one payment of ₹1299 + ₹699 = ₹1998.
  // booking[4] is cancelled — no transaction (cancelled before payment).
  // ─────────────────────────────────────────────────────────────────────────

  transactions: Transaction[] = [
    {
      transaction_id: this.genId(),
      payment_gateway_ref: 'PGR20260329001',
      payment_method: 'UPI',
      idempotency_key: 'idem-bkg001-001',
      payment_status: 'SUCCESS',
      amount: 1299,
      currency: 'INR',
      refund_amount: 0,
      refund_reason: null,
      transaction_at: '2026-03-29T03:20:22Z',
      verified_at: '2026-03-29T03:21:00Z',
      booking_id: this.bookings[0].booking_id,
    },
    {
      transaction_id: this.genId(),
      payment_gateway_ref: 'PGR20260401001',
      payment_method: 'CARD',
      idempotency_key: 'idem-bkg002-001',
      payment_status: 'SUCCESS',
      amount: 699,
      currency: 'INR',
      refund_amount: 0,
      refund_reason: null,
      transaction_at: '2026-04-01T16:34:00Z',
      verified_at: '2026-04-01T16:34:20Z',
      booking_id: this.bookings[1].booking_id,
    },
    {
      transaction_id: this.genId(),
      payment_gateway_ref: 'PGR20260402001',
      payment_method: 'NETBANKING',
      idempotency_key: 'idem-bkg003-001',
      payment_status: 'SUCCESS',
      amount: 499,
      currency: 'INR',
      refund_amount: 0,
      refund_reason: null,
      transaction_at: '2026-04-02T08:11:30Z',
      verified_at: '2026-04-02T08:11:45Z',
      booking_id: this.bookings[2].booking_id,
    },
    {
      transaction_id: this.genId(),
      payment_gateway_ref: 'PGR20260405001',
      payment_method: 'UPI',
      idempotency_key: 'idem-bkg004-001',
      payment_status: 'SUCCESS',
      // booking[3]: AC Repair ₹1299 + Leak Fix ₹699 = ₹1998
      amount: 1998,
      currency: 'INR',
      refund_amount: 0,
      refund_reason: null,
      transaction_at: '2026-04-05T11:02:00Z',
      verified_at: '2026-04-05T11:02:30Z',
      booking_id: this.bookings[3].booking_id,
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // REVENUE LEDGER
  //
  // One ledger row per job assignment (per service per booking), not per
  // booking. This is because each service has a different provider, unit
  // manager and potentially different collective manager.
  // The split is calculated on price_at_booking for that specific service line.
  //
  //  booking[0] AC Repair ₹1299:
  //    SP(Ravi)   78% = ₹1013.22
  //    UM(Karan)   8% = ₹103.92
  //    CM(Suresh)  4% = ₹51.96
  //    Platform   10% = ₹129.90
  //
  //  booking[1] Leak Fix ₹699:
  //    SP(Manoj)  78% = ₹545.22
  //    UM(Naveen)  8% = ₹55.92
  //    CM(Suresh)  4% = ₹27.96
  //    Platform   10% = ₹69.90
  //
  //  booking[2] Home Clean ₹499:
  //    SP(Ravi)   78% = ₹389.22
  //    UM(Karan)   8% = ₹39.92
  //    CM(Suresh)  4% = ₹19.96
  //    Platform   10% = ₹49.90
  //
  //  booking[3] line-1 AC Repair ₹1299 → Ravi:
  //    SP(Ravi)   78% = ₹1013.22
  //    UM(Karan)   8% = ₹103.92
  //    CM(Suresh)  4% = ₹51.96
  //    Platform   10% = ₹129.90
  //
  //  booking[3] line-2 Leak Fix ₹699 → Manoj:
  //    SP(Manoj)  78% = ₹545.22
  //    UM(Naveen)  8% = ₹55.92
  //    CM(Suresh)  4% = ₹27.96
  //    Platform   10% = ₹69.90
  //
  //  booking[4] CANCELLED — no ledger rows.
  // ─────────────────────────────────────────────────────────────────────────

  revenueLedger: RevenueLedger[] = [
    {
      ledger_id: this.genId(),
      payout_status: 'DISBURSED',
      provider_amount: 1013.22,
      um_amount: 103.92,
      cm_amount: 51.96,
      platform_amount: 129.9,
      created_at: '2026-03-29T03:22:00Z',
      paid_at: '2026-03-29T06:20:00Z',
      booking_id: this.bookings[0].booking_id,
      sp_id: this.serviceProviders[0].sp_id, // Ravi
      um_id: this.unitManagers[0].um_id, // Karan (AC unit)
      cm_id: this.collectiveManagers[0].cm_id, // Suresh
    },
    {
      ledger_id: this.genId(),
      payout_status: 'DISBURSED',
      provider_amount: 545.22,
      um_amount: 55.92,
      cm_amount: 27.96,
      platform_amount: 69.9,
      created_at: '2026-04-01T16:35:00Z',
      paid_at: '2026-04-02T10:45:00Z',
      booking_id: this.bookings[1].booking_id,
      sp_id: this.serviceProviders[1].sp_id, // Manoj
      um_id: this.unitManagers[1].um_id, // Naveen (Plumbing unit)
      cm_id: this.collectiveManagers[0].cm_id, // Suresh
    },
    {
      ledger_id: this.genId(),
      payout_status: 'DISBURSED',
      provider_amount: 389.22,
      um_amount: 39.92,
      cm_amount: 19.96,
      platform_amount: 49.9,
      created_at: '2026-04-02T08:12:00Z',
      paid_at: '2026-04-03T14:30:00Z',
      booking_id: this.bookings[2].booking_id,
      sp_id: this.serviceProviders[0].sp_id, // Ravi
      um_id: this.unitManagers[0].um_id, // Karan (AC unit — Ravi cleans too)
      cm_id: this.collectiveManagers[0].cm_id, // Suresh
    },
    // booking[3] – line 1: AC Repair → Ravi
    {
      ledger_id: this.genId(),
      payout_status: 'DISBURSED',
      provider_amount: 1013.22,
      um_amount: 103.92,
      cm_amount: 51.96,
      platform_amount: 129.9,
      created_at: '2026-04-05T11:03:00Z',
      paid_at: '2026-04-07T10:40:00Z',
      booking_id: this.bookings[3].booking_id,
      sp_id: this.serviceProviders[0].sp_id, // Ravi
      um_id: this.unitManagers[0].um_id, // Karan (AC unit)
      cm_id: this.collectiveManagers[0].cm_id, // Suresh
    },
    // booking[3] – line 2: Leak Fix → Manoj
    {
      ledger_id: this.genId(),
      payout_status: 'DISBURSED',
      provider_amount: 545.22,
      um_amount: 55.92,
      cm_amount: 27.96,
      platform_amount: 69.9,
      created_at: '2026-04-05T11:03:00Z',
      paid_at: '2026-04-07T12:35:00Z',
      booking_id: this.bookings[3].booking_id,
      sp_id: this.serviceProviders[1].sp_id, // Manoj
      um_id: this.unitManagers[1].um_id, // Naveen (Plumbing unit)
      cm_id: this.collectiveManagers[0].cm_id, // Suresh
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // REVIEWS
  //
  // One review per service per booking (Urban Company model).
  // The customer gets one review prompt per completed job assignment.
  // booking[3] produces TWO reviews — one for AC Repair, one for Leak Fix —
  // even though both were paid in a single transaction.
  // rating = assignment_score of the corresponding JobAssignment row.
  // booking[4] cancelled — no reviews.
  // ─────────────────────────────────────────────────────────────────────────

  reviews: Review[] = [
    {
      review_id: this.genId(),
      rating: 5, // matches jobAssignments[0].assignment_score
      comment: 'Quick diagnosis and clean AC repair. Very professional.',
      created_at: '2026-03-29T06:25:00Z',
      booking_id: this.bookings[0].booking_id,
      service_id: this.services[2].service_id, // Split AC Repair
      customer_id: this.customers[0].customer_id,
      sp_id: this.serviceProviders[0].sp_id, // Ravi
    },
    {
      review_id: this.genId(),
      rating: 5, // matches jobAssignments[1].assignment_score
      comment: 'Leak issue resolved fully, no rework needed.',
      created_at: '2026-04-02T10:50:00Z',
      booking_id: this.bookings[1].booking_id,
      service_id: this.services[3].service_id, // Kitchen Sink Leak Fix
      customer_id: this.customers[1].customer_id,
      sp_id: this.serviceProviders[1].sp_id, // Manoj
    },
    {
      review_id: this.genId(),
      rating: 4, // matches jobAssignments[2].assignment_score
      comment: 'Service quality was good and on-time completion.',
      created_at: '2026-04-03T14:35:00Z',
      booking_id: this.bookings[2].booking_id,
      service_id: this.services[0].service_id, // Standard Home Clean
      customer_id: this.customers[2].customer_id,
      sp_id: this.serviceProviders[0].sp_id, // Ravi
    },
    // booking[3] – review for AC Repair line
    {
      review_id: this.genId(),
      rating: 4, // matches jobAssignments[3].assignment_score
      comment: 'AC is running well, arrived on time.',
      created_at: '2026-04-07T13:00:00Z',
      booking_id: this.bookings[3].booking_id,
      service_id: this.services[2].service_id, // Split AC Repair
      customer_id: this.customers[0].customer_id,
      sp_id: this.serviceProviders[0].sp_id, // Ravi
    },
    // booking[3] – review for Leak Fix line (same booking, separate review prompt)
    {
      review_id: this.genId(),
      rating: 5, // matches jobAssignments[4].assignment_score
      comment: 'Manoj was excellent, no leaks at all after the fix.',
      created_at: '2026-04-07T13:05:00Z',
      booking_id: this.bookings[3].booking_id,
      service_id: this.services[3].service_id, // Kitchen Sink Leak Fix
      customer_id: this.customers[0].customer_id,
      sp_id: this.serviceProviders[1].sp_id, // Manoj
    },
  ];

  platformSettings: PlatformSetting[] = [
    {
      setting_id: this.genId(),
      key: 'max_booking_window_days',
      value: '30',
      description: 'Max days ahead a customer can schedule',
      updated_at: new Date().toISOString(),
      updated_by: this.superUsers[0].super_user_id,
    },
    {
      setting_id: this.genId(),
      key: 'maintenance_mode',
      value: 'false',
      description: 'Platform maintenance mode toggle',
      updated_at: new Date().toISOString(),
      updated_by: this.superUsers[0].super_user_id,
    },
    {
      setting_id: this.genId(),
      key: 'revenue_split_sp_percentage',
      value: '78',
      description: 'Percentage of booking amount going to service provider',
      updated_at: new Date().toISOString(),
      updated_by: this.superUsers[0].super_user_id,
    },
    {
      setting_id: this.genId(),
      key: 'revenue_split_um_percentage',
      value: '8',
      description: 'Percentage of booking amount going to unit manager',
      updated_at: new Date().toISOString(),
      updated_by: this.superUsers[0].super_user_id,
    },
    {
      setting_id: this.genId(),
      key: 'revenue_split_cm_percentage',
      value: '4',
      description: 'Percentage of booking amount going to collective manager',
      updated_at: new Date().toISOString(),
      updated_by: this.superUsers[0].super_user_id,
    },
    {
      setting_id: this.genId(),
      key: 'instant_booking_radius_km',
      value: '10',
      description: 'Max km radius for provider search on instant bookings',
      updated_at: new Date().toISOString(),
      updated_by: this.superUsers[0].super_user_id,
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────────────

  genId(): string {
    return uuid();
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
    return new Date().toISOString();
  }
}
