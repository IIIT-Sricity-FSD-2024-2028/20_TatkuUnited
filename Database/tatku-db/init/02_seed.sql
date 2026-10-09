-- ============================================================
-- TATKU UNITED - Seed Data (New Design)
-- Source of truth: back-end/src/common/database/database.service.ts
-- ============================================================

BEGIN;

-- ============================================================
-- Core org hierarchy
-- ============================================================

INSERT INTO collective (collective_id, collective_name, is_active, created_at)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'North Chennai Collective', TRUE, '2025-10-01T00:00:00Z');

INSERT INTO sector (sector_id, sector_name, state, region, density_tier, is_active, collective_id)
VALUES
    ('00000000-0000-0000-0000-000000000011', 'Downtown Core', 'Tamil Nadu', 'Central', 'HIGH', TRUE, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000012', 'Anna Nagar West', 'Tamil Nadu', 'North', 'MEDIUM', TRUE, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000013', 'Velachery South', 'Tamil Nadu', 'South', 'HIGH', TRUE, '00000000-0000-0000-0000-000000000001');

INSERT INTO unit (unit_id, unit_name, rating, rating_count, is_active, created_at, collective_id)
VALUES
    ('00000000-0000-0000-0000-000000000021', 'Electrical & AC Services', 4.33, 3, TRUE, '2025-10-31T00:00:00Z', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000022', 'Plumbing & Sanitary Services', 5.00, 2, TRUE, '2025-11-20T00:00:00Z', '00000000-0000-0000-0000-000000000001');

-- ============================================================
-- Auth / users
-- ============================================================

INSERT INTO super_user (super_user_id, name, email, password_hash, phone, is_active, last_login, created_at)
VALUES
    ('00000000-0000-0000-0000-000000000031', 'Mark', 'super_user.mark@tatku.com', 'scrypt:seed:super-user-mark', '9876543210', TRUE, '2026-03-31T10:00:00Z', '2023-01-01T00:00:00Z');

INSERT INTO collective_manager (cm_id, name, email, password_hash, phone, is_active, created_at, updated_at, collective_id)
VALUES
    ('00000000-0000-0000-0000-000000000041', 'Suresh Patel', 'suresh@collective.com', 'scrypt:seed:cm-suresh', '9988776655', TRUE, '2024-10-10T00:00:00Z', '2026-04-10T00:00:00Z', '00000000-0000-0000-0000-000000000001');

INSERT INTO unit_manager (um_id, name, email, password_hash, phone, is_active, created_at, updated_at, unit_id)
VALUES
    ('00000000-0000-0000-0000-000000000051', 'Karan Mehta', 'karan.m@unit.com', 'scrypt:seed:um-karan', '9955443322', TRUE, '2024-11-09T00:00:00Z', '2026-04-10T00:00:00Z', '00000000-0000-0000-0000-000000000021'),
    ('00000000-0000-0000-0000-000000000052', 'Naveen Raj', 'naveen.r@unit.com', 'scrypt:seed:um-naveen', '9930012277', TRUE, '2024-12-05T00:00:00Z', '2026-04-09T00:00:00Z', '00000000-0000-0000-0000-000000000022');

INSERT INTO service_provider (
    sp_id, name, email, password_hash, phone, dob, address, gender,
    rating, rating_count, is_active, account_status, deactivation_requested,
    hour_start, hour_end, created_at, updated_at, unit_id, home_sector_id
)
VALUES
    (
        '00000000-0000-0000-0000-000000000061', 'Ravi Kumar', 'ravi.kumar@mail.com', 'scrypt:seed:sp-ravi', '9000000001',
        '1990-04-12', '12 Anna Nagar, Chennai', 'Male',
        4.33, 3, TRUE, 'active', FALSE,
        '08:00', '18:00', '2024-10-31T08:00:00Z', '2026-04-10T11:30:00Z', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000011'
    ),
    (
        '00000000-0000-0000-0000-000000000062', 'Manoj Selvam', 'manoj.selvam@mail.com', 'scrypt:seed:sp-manoj', '9000000002',
        '1988-11-28', '22 Mogappair, Chennai', 'Male',
        5.00, 2, TRUE, 'active', FALSE,
        '09:00', '18:00', '2024-11-22T08:00:00Z', '2026-04-10T09:20:00Z', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000012'
    ),
    (
        '00000000-0000-0000-0000-000000000063', 'Priya Nair', 'priya.nair@mail.com', 'scrypt:seed:sp-priya', '9000000003',
        '1994-02-10', '18 Velachery, Chennai', 'Female',
        0.00, 0, TRUE, 'active', FALSE,
        '08:00', '17:00', '2025-01-06T08:00:00Z', '2026-04-01T10:00:00Z', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000013'
    );

INSERT INTO provider_unavailability (unavailability_id, date, hour_start, hour_end, reason, is_recurring, created_at, sp_id)
VALUES
    ('00000000-0000-0000-0000-000000000071', '2026-04-05', '08:00', '12:00', 'Medical leave', FALSE, '2026-03-20T10:00:00Z', '00000000-0000-0000-0000-000000000061'),
    ('00000000-0000-0000-0000-000000000072', '2026-04-06', '14:00', '18:00', 'Family event', FALSE, '2026-03-25T11:30:00Z', '00000000-0000-0000-0000-000000000062');

-- ============================================================
-- Skills and services catalog
-- ============================================================

INSERT INTO skill (skill_id, skill_name, description)
VALUES
    ('00000000-0000-0000-0000-000000000081', 'Plumbing', 'Installation and repair of pipes, fixtures, fittings'),
    ('00000000-0000-0000-0000-000000000082', 'Electrical', 'Electrical installation and repair'),
    ('00000000-0000-0000-0000-000000000083', 'Cleaning', 'Professional home and office cleaning'),
    ('00000000-0000-0000-0000-000000000084', 'AC Repair', 'Diagnostics and repair for split and window AC units');

INSERT INTO provider_skill (sp_id, skill_id, verification_status, verified_at)
VALUES
    ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000082', 'Verified', '2026-03-25T10:00:00Z'),
    ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000084', 'Verified', '2026-03-25T10:05:00Z'),
    ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000083', 'Verified', '2026-03-26T09:00:00Z'),
    ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000081', 'Verified', '2026-03-26T09:30:00Z'),
    ('00000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000083', 'Verified', '2026-03-28T12:00:00Z');

INSERT INTO category (category_id, category_name, description, icon, image_url, average_rating, rating_count, is_available)
VALUES
    ('00000000-0000-0000-0000-000000000091', 'Home Cleaning', 'All home cleaning services', '🧹', 'https://placehold.co/400x200/4A90D9/white?text=Home+Cleaning', 4.00, 1, TRUE),
    ('00000000-0000-0000-0000-000000000092', 'Appliance Repair', 'Appliance diagnostics and repair services', '🛠️', 'https://placehold.co/400x200/2D9CDB/white?text=Appliance+Repair', 4.50, 2, TRUE),
    ('00000000-0000-0000-0000-000000000093', 'Plumbing', 'Leak fixing, fittings, and sanitary service work', '🚰', 'https://placehold.co/400x200/1E8E3E/white?text=Plumbing', 5.00, 2, TRUE);

INSERT INTO service (
    service_id, service_name, description, image_url, base_price,
    estimated_duration_min, average_rating, rating_count, is_available, category_id
)
VALUES
    (
        '00000000-0000-0000-0000-000000000101', 'Standard Home Clean',
        'Complete standard clean for up to 3BHK homes.',
        'https://placehold.co/400x200/4A90D9/white?text=Standard+Clean',
        499, 120, 4.00, 1, TRUE, '00000000-0000-0000-0000-000000000091'
    ),
    (
        '00000000-0000-0000-0000-000000000102', 'Deep Home Clean',
        'Deep cleaning for kitchen, bathrooms, and living areas.',
        'https://placehold.co/400x200/4A90D9/white?text=Deep+Clean',
        899, 180, 0.00, 0, TRUE, '00000000-0000-0000-0000-000000000091'
    ),
    (
        '00000000-0000-0000-0000-000000000103', 'Split AC Repair',
        'Inspection and repair for common split AC faults.',
        'https://placehold.co/400x200/2D9CDB/white?text=AC+Repair',
        1299, 90, 4.50, 2, TRUE, '00000000-0000-0000-0000-000000000092'
    ),
    (
        '00000000-0000-0000-0000-000000000104', 'Kitchen Sink Leak Fix',
        'Leak detection and repair for kitchen sink pipelines.',
        'https://placehold.co/400x200/1E8E3E/white?text=Leak+Fix',
        699, 75, 5.00, 2, TRUE, '00000000-0000-0000-0000-000000000093'
    );

INSERT INTO service_skill (service_id, skill_id)
VALUES
    ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000083'),
    ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000083'),
    ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000084'),
    ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000082'),
    ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000081');

INSERT INTO service_content (service_id, how_it_works, what_is_covered, what_is_not_covered)
VALUES
    (
        '00000000-0000-0000-0000-000000000101',
        '[{"step_title":"Pre-clean inspection","step_description":"The professional reviews room condition before starting."},{"step_title":"Systematic cleaning","step_description":"Dusting, sweeping, mopping done area by area."},{"step_title":"Final walkthrough","step_description":"Quality check performed with customer."}]'::jsonb,
        '["Dusting of furniture","Sweeping and mopping","Surface wipe-down"]'::jsonb,
        '["Deep stain removal","Post-construction debris"]'::jsonb
    ),
    (
        '00000000-0000-0000-0000-000000000102',
        '[{"step_title":"Area assessment","step_description":"Professional assesses deep cleaning requirement."},{"step_title":"Deep cleaning pass","step_description":"High-touch and difficult areas are deep cleaned."},{"step_title":"Final sanitization","step_description":"Final sanitization and completion check."}]'::jsonb,
        '["Kitchen degreasing","Bathroom descaling","Floor scrubbing"]'::jsonb,
        '["Pest control","Wall repainting"]'::jsonb
    ),
    (
        '00000000-0000-0000-0000-000000000103',
        '[{"step_title":"Fault diagnosis","step_description":"Technician checks electrical and cooling issues."},{"step_title":"Repair and replacement","step_description":"Required components are repaired or replaced."},{"step_title":"Cooling performance test","step_description":"Post-repair cooling benchmark is verified."}]'::jsonb,
        '["Basic electrical checks","Gas pressure check","Minor part replacement"]'::jsonb,
        '["Compressor replacement cost","External carpentry work"]'::jsonb
    ),
    (
        '00000000-0000-0000-0000-000000000104',
        '[{"step_title":"Leak point tracing","step_description":"Plumber traces source of the leak."},{"step_title":"Seal/fitting correction","step_description":"Faulty joints and fittings are corrected."},{"step_title":"Flow test","step_description":"Post-fix flow and leak test are performed."}]'::jsonb,
        '["Leak tracing","Seal replacement","Pipe joint tightening"]'::jsonb,
        '["Full pipeline relaying","Civil wall repair"]'::jsonb
    );

INSERT INTO service_faq (faq_id, question, answer, display_order, service_id)
VALUES
    ('00000000-0000-0000-0000-000000000111', 'How long does a standard clean take?', 'Typically 2 hours for a 2BHK flat.', 1, '00000000-0000-0000-0000-000000000101'),
    ('00000000-0000-0000-0000-000000000112', 'Do I need to provide any cleaning materials?', 'No, the professional carries standard supplies and tools.', 1, '00000000-0000-0000-0000-000000000102'),
    ('00000000-0000-0000-0000-000000000113', 'Is gas refill included in AC repair?', 'Gas refill is charged separately if required after diagnosis.', 1, '00000000-0000-0000-0000-000000000103'),
    ('00000000-0000-0000-0000-000000000114', 'Can this service fix concealed pipe leakage?', 'Only exposed and accessible leak points are covered.', 1, '00000000-0000-0000-0000-000000000104');

-- ============================================================
-- Customers, bookings, assignments
-- ============================================================

INSERT INTO customer (customer_id, full_name, email, password_hash, phone, dob, address, rating, is_active, home_sector_id)
VALUES
    ('00000000-0000-0000-0000-000000000121', 'Aditya Verma', 'aditya.v@gmail.com', 'scrypt:seed:cust-aditya', '9812345678', '1992-03-15', '14 Boat Club Road, Chennai', 0, TRUE, '00000000-0000-0000-0000-000000000011'),
    ('00000000-0000-0000-0000-000000000122', 'Lakshmi Iyer', 'lakshmi.iyer@gmail.com', 'scrypt:seed:cust-lakshmi', '9894098765', '1995-07-09', '33 Anna Nagar, Chennai', 0, TRUE, '00000000-0000-0000-0000-000000000012'),
    ('00000000-0000-0000-0000-000000000123', 'Arjun N', 'arjun.n@gmail.com', 'scrypt:seed:cust-arjun', '9900023456', '1998-01-18', '77 Velachery Main Road, Chennai', 0, TRUE, '00000000-0000-0000-0000-000000000013');

-- carts/cart_items intentionally empty (as in source seed)

INSERT INTO booking (
    booking_id, booking_type, service_address, scheduled_at, status,
    failure_reason, is_active, created_at, updated_at, customer_id, sector_id
)
VALUES
    (
        '00000000-0000-0000-0000-000000000131', 'INSTANT', '14 Boat Club Road, Chennai', '2026-03-29T03:48:22Z', 'COMPLETED',
        NULL, TRUE, '2026-03-29T03:18:22Z', '2026-03-29T06:18:22Z', '00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000011'
    ),
    (
        '00000000-0000-0000-0000-000000000132', 'SCHEDULED', '33 Anna Nagar, Chennai', '2026-04-02T09:00:00Z', 'COMPLETED',
        NULL, TRUE, '2026-04-01T16:30:00Z', '2026-04-02T10:40:00Z', '00000000-0000-0000-0000-000000000122', '00000000-0000-0000-0000-000000000012'
    ),
    (
        '00000000-0000-0000-0000-000000000133', 'SCHEDULED', '77 Velachery Main Road, Chennai', '2026-04-03T12:00:00Z', 'COMPLETED',
        NULL, TRUE, '2026-04-02T08:10:00Z', '2026-04-03T14:20:00Z', '00000000-0000-0000-0000-000000000123', '00000000-0000-0000-0000-000000000013'
    ),
    (
        '00000000-0000-0000-0000-000000000134', 'SCHEDULED', '14 Boat Club Road, Chennai', '2026-04-07T09:00:00Z', 'COMPLETED',
        NULL, TRUE, '2026-04-05T11:00:00Z', '2026-04-07T12:30:00Z', '00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000011'
    ),
    (
        '00000000-0000-0000-0000-000000000135', 'SCHEDULED', '14 Boat Club Road, Chennai', '2026-04-10T11:00:00Z', 'CANCELLED',
        'Customer cancelled before assignment', FALSE, '2026-04-08T09:15:00Z', '2026-04-08T10:00:00Z', '00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000011'
    );

INSERT INTO booking_service (booking_id, service_id, quantity, price_at_booking)
VALUES
    ('00000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000103', 1, 1299),
    ('00000000-0000-0000-0000-000000000132', '00000000-0000-0000-0000-000000000104', 1, 699),
    ('00000000-0000-0000-0000-000000000133', '00000000-0000-0000-0000-000000000101', 1, 499),
    ('00000000-0000-0000-0000-000000000134', '00000000-0000-0000-0000-000000000103', 1, 1299),
    ('00000000-0000-0000-0000-000000000134', '00000000-0000-0000-0000-000000000104', 1, 699),
    ('00000000-0000-0000-0000-000000000135', '00000000-0000-0000-0000-000000000102', 1, 899);

INSERT INTO job_assignment (
    assignment_id, service_id, scheduled_date, hour_start, hour_end,
    status, assignment_score, notes, assigned_at, created_at, updated_at,
    booking_id, sp_id
)
VALUES
    (
        '00000000-0000-0000-0000-000000000141', '00000000-0000-0000-0000-000000000103', '2026-03-29', '09:00', '10:30',
        'COMPLETED', 5, NULL, '2026-03-29T03:23:22Z', '2026-03-29T03:23:22Z', '2026-03-29T06:18:22Z',
        '00000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000061'
    ),
    (
        '00000000-0000-0000-0000-000000000142', '00000000-0000-0000-0000-000000000104', '2026-04-02', '09:00', '10:15',
        'COMPLETED', 5, NULL, '2026-04-01T16:36:00Z', '2026-04-01T16:36:00Z', '2026-04-02T10:40:00Z',
        '00000000-0000-0000-0000-000000000132', '00000000-0000-0000-0000-000000000062'
    ),
    (
        '00000000-0000-0000-0000-000000000143', '00000000-0000-0000-0000-000000000101', '2026-04-03', '12:00', '14:00',
        'COMPLETED', 4, NULL, '2026-04-02T08:15:00Z', '2026-04-02T08:15:00Z', '2026-04-03T14:20:00Z',
        '00000000-0000-0000-0000-000000000133', '00000000-0000-0000-0000-000000000061'
    ),
    (
        '00000000-0000-0000-0000-000000000144', '00000000-0000-0000-0000-000000000103', '2026-04-07', '09:00', '10:30',
        'COMPLETED', 4, NULL, '2026-04-05T11:05:00Z', '2026-04-05T11:05:00Z', '2026-04-07T10:35:00Z',
        '00000000-0000-0000-0000-000000000134', '00000000-0000-0000-0000-000000000061'
    ),
    (
        '00000000-0000-0000-0000-000000000145', '00000000-0000-0000-0000-000000000104', '2026-04-07', '11:00', '12:15',
        'COMPLETED', 5, NULL, '2026-04-05T11:05:00Z', '2026-04-05T11:05:00Z', '2026-04-07T12:30:00Z',
        '00000000-0000-0000-0000-000000000134', '00000000-0000-0000-0000-000000000062'
    );

-- ============================================================
-- Transactions, revenue, reviews, settings
-- ============================================================

INSERT INTO transactions (
    transaction_id, payment_gateway_ref, payment_method, idempotency_key,
    payment_status, amount, currency, refund_amount, refund_reason,
    transaction_at, verified_at, booking_id
)
VALUES
    (
        '00000000-0000-0000-0000-000000000151', 'PGR20260329001', 'UPI', 'idem-bkg001-001',
        'SUCCESS', 1299, 'INR', 0, NULL, '2026-03-29T03:20:22Z', '2026-03-29T03:21:00Z', '00000000-0000-0000-0000-000000000131'
    ),
    (
        '00000000-0000-0000-0000-000000000152', 'PGR20260401001', 'CARD', 'idem-bkg002-001',
        'SUCCESS', 699, 'INR', 0, NULL, '2026-04-01T16:34:00Z', '2026-04-01T16:34:20Z', '00000000-0000-0000-0000-000000000132'
    ),
    (
        '00000000-0000-0000-0000-000000000153', 'PGR20260402001', 'NETBANKING', 'idem-bkg003-001',
        'SUCCESS', 499, 'INR', 0, NULL, '2026-04-02T08:11:30Z', '2026-04-02T08:11:45Z', '00000000-0000-0000-0000-000000000133'
    ),
    (
        '00000000-0000-0000-0000-000000000154', 'PGR20260405001', 'UPI', 'idem-bkg004-001',
        'SUCCESS', 1998, 'INR', 0, NULL, '2026-04-05T11:02:00Z', '2026-04-05T11:02:30Z', '00000000-0000-0000-0000-000000000134'
    );

INSERT INTO revenue_ledger (
    ledger_id, payout_status, provider_amount, um_amount, cm_amount,
    platform_amount, created_at, paid_at, booking_id, sp_id, um_id, cm_id
)
VALUES
    (
        '00000000-0000-0000-0000-000000000161', 'DISBURSED', 1013.22, 103.92, 51.96,
        129.90, '2026-03-29T03:22:00Z', '2026-03-29T06:20:00Z', '00000000-0000-0000-0000-000000000131',
        '00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000041'
    ),
    (
        '00000000-0000-0000-0000-000000000162', 'DISBURSED', 545.22, 55.92, 27.96,
        69.90, '2026-04-01T16:35:00Z', '2026-04-02T10:45:00Z', '00000000-0000-0000-0000-000000000132',
        '00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000041'
    ),
    (
        '00000000-0000-0000-0000-000000000163', 'DISBURSED', 389.22, 39.92, 19.96,
        49.90, '2026-04-02T08:12:00Z', '2026-04-03T14:30:00Z', '00000000-0000-0000-0000-000000000133',
        '00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000041'
    ),
    (
        '00000000-0000-0000-0000-000000000164', 'DISBURSED', 1013.22, 103.92, 51.96,
        129.90, '2026-04-05T11:03:00Z', '2026-04-07T10:40:00Z', '00000000-0000-0000-0000-000000000134',
        '00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000041'
    ),
    (
        '00000000-0000-0000-0000-000000000165', 'DISBURSED', 545.22, 55.92, 27.96,
        69.90, '2026-04-05T11:03:00Z', '2026-04-07T12:35:00Z', '00000000-0000-0000-0000-000000000134',
        '00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000041'
    );

INSERT INTO review (review_id, rating, comment, created_at, booking_id, service_id, customer_id, sp_id)
VALUES
    (
        '00000000-0000-0000-0000-000000000171', 5, 'Quick diagnosis and clean AC repair. Very professional.',
        '2026-03-29T06:25:00Z', '00000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000103',
        '00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000061'
    ),
    (
        '00000000-0000-0000-0000-000000000172', 5, 'Leak issue resolved fully, no rework needed.',
        '2026-04-02T10:50:00Z', '00000000-0000-0000-0000-000000000132', '00000000-0000-0000-0000-000000000104',
        '00000000-0000-0000-0000-000000000122', '00000000-0000-0000-0000-000000000062'
    ),
    (
        '00000000-0000-0000-0000-000000000173', 4, 'Service quality was good and on-time completion.',
        '2026-04-03T14:35:00Z', '00000000-0000-0000-0000-000000000133', '00000000-0000-0000-0000-000000000101',
        '00000000-0000-0000-0000-000000000123', '00000000-0000-0000-0000-000000000061'
    ),
    (
        '00000000-0000-0000-0000-000000000174', 4, 'AC is running well, arrived on time.',
        '2026-04-07T13:00:00Z', '00000000-0000-0000-0000-000000000134', '00000000-0000-0000-0000-000000000103',
        '00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000061'
    ),
    (
        '00000000-0000-0000-0000-000000000175', 5, 'Manoj was excellent, no leaks at all after the fix.',
        '2026-04-07T13:05:00Z', '00000000-0000-0000-0000-000000000134', '00000000-0000-0000-0000-000000000104',
        '00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000062'
    );

INSERT INTO platform_setting (setting_id, key, value, description, updated_at, updated_by)
VALUES
    ('00000000-0000-0000-0000-000000000181', 'max_booking_window_days', '30', 'Max days ahead a customer can schedule', NOW(), '00000000-0000-0000-0000-000000000031'),
    ('00000000-0000-0000-0000-000000000182', 'maintenance_mode', 'false', 'Platform maintenance mode toggle', NOW(), '00000000-0000-0000-0000-000000000031'),
    ('00000000-0000-0000-0000-000000000183', 'revenue_split_sp_percentage', '78', 'Percentage of booking amount going to service provider', NOW(), '00000000-0000-0000-0000-000000000031'),
    ('00000000-0000-0000-0000-000000000184', 'revenue_split_um_percentage', '8', 'Percentage of booking amount going to unit manager', NOW(), '00000000-0000-0000-0000-000000000031'),
    ('00000000-0000-0000-0000-000000000185', 'revenue_split_cm_percentage', '4', 'Percentage of booking amount going to collective manager', NOW(), '00000000-0000-0000-0000-000000000031'),
    ('00000000-0000-0000-0000-000000000186', 'instant_booking_radius_km', '10', 'Max km radius for provider search on instant bookings', NOW(), '00000000-0000-0000-0000-000000000031');

COMMIT;
