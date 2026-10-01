-- ============================================================
-- TATKU UNITED - Database Schema (New Design)
-- Source of truth: back-end/src/common/database/database.service.ts
-- PostgreSQL 16+
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Core org hierarchy
-- ============================================================

CREATE TABLE IF NOT EXISTS collective (
    collective_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collective_name VARCHAR(200) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sector (
    sector_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_name VARCHAR(200) NOT NULL,
    state VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    density_tier VARCHAR(20) NOT NULL CHECK (density_tier IN ('HIGH', 'MEDIUM', 'LOW')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    collective_id UUID NOT NULL REFERENCES collective(collective_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS unit (
    unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_name VARCHAR(200) NOT NULL,
    rating NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    collective_id UUID NOT NULL REFERENCES collective(collective_id) ON DELETE RESTRICT
);

-- ============================================================
-- Auth / users
-- ============================================================

CREATE TABLE IF NOT EXISTS super_user (
    super_user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collective_manager (
    cm_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    collective_id UUID NOT NULL REFERENCES collective(collective_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS unit_manager (
    um_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unit_id UUID NOT NULL REFERENCES unit(unit_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS service_provider (
    sp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    dob DATE,
    address TEXT,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
    rating NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    account_status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deactivated', 'pending')),
    deactivation_requested BOOLEAN NOT NULL DEFAULT FALSE,
    hour_start TIME NOT NULL,
    hour_end TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unit_id UUID NOT NULL REFERENCES unit(unit_id) ON DELETE RESTRICT,
    home_sector_id UUID NOT NULL REFERENCES sector(sector_id) ON DELETE RESTRICT,
    CHECK (hour_end > hour_start)
);

CREATE TABLE IF NOT EXISTS provider_unavailability (
    unavailability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE,
    hour_start TIME NOT NULL,
    hour_end TIME NOT NULL,
    reason VARCHAR(300),
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sp_id UUID NOT NULL REFERENCES service_provider(sp_id) ON DELETE CASCADE,
    CHECK (hour_end > hour_start)
);

-- ============================================================
-- Skills and services catalog
-- ============================================================

CREATE TABLE IF NOT EXISTS skill (
    skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS provider_skill (
    sp_id UUID NOT NULL REFERENCES service_provider(sp_id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skill(skill_id) ON DELETE RESTRICT,
    verification_status VARCHAR(30) NOT NULL CHECK (verification_status IN ('Verified', 'Pending', 'Rejected')),
    verified_at TIMESTAMPTZ,
    PRIMARY KEY (sp_id, skill_id)
);

CREATE TABLE IF NOT EXISTS category (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    icon VARCHAR(255) NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    average_rating NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
    rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS service (
    service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
    estimated_duration_min INTEGER NOT NULL CHECK (estimated_duration_min > 0),
    average_rating NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
    rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    category_id UUID NOT NULL REFERENCES category(category_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS service_skill (
    service_id UUID NOT NULL REFERENCES service(service_id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skill(skill_id) ON DELETE RESTRICT,
    PRIMARY KEY (service_id, skill_id)
);

CREATE TABLE IF NOT EXISTS service_content (
    service_id UUID PRIMARY KEY REFERENCES service(service_id) ON DELETE CASCADE,
    how_it_works JSONB NOT NULL DEFAULT '[]'::jsonb,
    what_is_covered JSONB NOT NULL DEFAULT '[]'::jsonb,
    what_is_not_covered JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS service_faq (
    faq_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    service_id UUID NOT NULL REFERENCES service(service_id) ON DELETE CASCADE
);

-- ============================================================
-- Customer, cart and bookings
-- ============================================================

CREATE TABLE IF NOT EXISTS customer (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    dob DATE,
    address TEXT,
    rating NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    home_sector_id UUID NOT NULL REFERENCES sector(sector_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS cart (
    cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_type VARCHAR(20) NOT NULL CHECK (booking_type IN ('INSTANT', 'SCHEDULED')),
    scheduled_at TIMESTAMPTZ,
    service_address TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    customer_id UUID NOT NULL UNIQUE REFERENCES customer(customer_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_item (
    cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price_snapshot NUMERIC(10,2) NOT NULL CHECK (price_snapshot >= 0),
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cart_id UUID NOT NULL REFERENCES cart(cart_id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES service(service_id) ON DELETE RESTRICT,
    UNIQUE (cart_id, service_id)
);

CREATE TABLE IF NOT EXISTS booking (
    booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_type VARCHAR(20) NOT NULL CHECK (booking_type IN ('INSTANT', 'SCHEDULED')),
    service_address TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'REASSIGNED', 'CANCELLED')),
    failure_reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    customer_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE RESTRICT,
    sector_id UUID NOT NULL REFERENCES sector(sector_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS booking_service (
    booking_id UUID NOT NULL REFERENCES booking(booking_id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES service(service_id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price_at_booking NUMERIC(10,2) NOT NULL CHECK (price_at_booking >= 0),
    PRIMARY KEY (booking_id, service_id)
);

CREATE TABLE IF NOT EXISTS job_assignment (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES service(service_id) ON DELETE RESTRICT,
    scheduled_date DATE NOT NULL,
    hour_start TIME NOT NULL,
    hour_end TIME NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'RESCHEDULED')),
    assignment_score NUMERIC(3,2) CHECK (assignment_score >= 0 AND assignment_score <= 5),
    notes TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    booking_id UUID NOT NULL REFERENCES booking(booking_id) ON DELETE CASCADE,
    sp_id UUID NOT NULL REFERENCES service_provider(sp_id) ON DELETE RESTRICT,
    CHECK (hour_end > hour_start)
);

-- ============================================================
-- Payments, ledger, reviews, platform settings
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_gateway_ref VARCHAR(255) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    refund_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
    refund_reason TEXT,
    transaction_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    booking_id UUID NOT NULL UNIQUE REFERENCES booking(booking_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS revenue_ledger (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_status VARCHAR(20) NOT NULL CHECK (payout_status IN ('PENDING', 'DISBURSED', 'FAILED', 'HELD')),
    provider_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (provider_amount >= 0),
    um_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (um_amount >= 0),
    cm_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cm_amount >= 0),
    platform_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (platform_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    booking_id UUID NOT NULL REFERENCES booking(booking_id) ON DELETE CASCADE,
    sp_id UUID NOT NULL REFERENCES service_provider(sp_id) ON DELETE RESTRICT,
    um_id UUID NOT NULL REFERENCES unit_manager(um_id) ON DELETE RESTRICT,
    cm_id UUID NOT NULL REFERENCES collective_manager(cm_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS review (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    booking_id UUID NOT NULL REFERENCES booking(booking_id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES service(service_id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE RESTRICT,
    sp_id UUID NOT NULL REFERENCES service_provider(sp_id) ON DELETE RESTRICT,
    UNIQUE (booking_id, service_id, customer_id)
);

CREATE TABLE IF NOT EXISTS platform_setting (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(120) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES super_user(super_user_id) ON DELETE RESTRICT
);

-- ============================================================
-- Helpful indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_sector_collective_id ON sector (collective_id);
CREATE INDEX IF NOT EXISTS idx_unit_collective_id ON unit (collective_id);
CREATE INDEX IF NOT EXISTS idx_um_unit_id ON unit_manager (unit_id);
CREATE INDEX IF NOT EXISTS idx_sp_unit_id ON service_provider (unit_id);
CREATE INDEX IF NOT EXISTS idx_sp_home_sector_id ON service_provider (home_sector_id);
CREATE INDEX IF NOT EXISTS idx_provider_unavailability_sp_id ON provider_unavailability (sp_id);
CREATE INDEX IF NOT EXISTS idx_service_category_id ON service (category_id);
CREATE INDEX IF NOT EXISTS idx_service_faq_service_id ON service_faq (service_id);
CREATE INDEX IF NOT EXISTS idx_cart_customer_id ON cart (customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_item_cart_id ON cart_item (cart_id);
CREATE INDEX IF NOT EXISTS idx_booking_customer_id ON booking (customer_id);
CREATE INDEX IF NOT EXISTS idx_booking_sector_id ON booking (sector_id);
CREATE INDEX IF NOT EXISTS idx_booking_status ON booking (status);
CREATE INDEX IF NOT EXISTS idx_job_assignment_booking_id ON job_assignment (booking_id);
CREATE INDEX IF NOT EXISTS idx_job_assignment_sp_id ON job_assignment (sp_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON transactions (booking_id);
CREATE INDEX IF NOT EXISTS idx_revenue_ledger_booking_id ON revenue_ledger (booking_id);
CREATE INDEX IF NOT EXISTS idx_review_booking_id ON review (booking_id);
