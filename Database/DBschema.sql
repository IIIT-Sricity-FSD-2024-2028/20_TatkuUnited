-- ============================================================
-- TATKU UNITED - Database Schema (Regional Architecture)
-- Source of truth: back-end/src/common/database/database.service.ts
-- PostgreSQL 16+
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Core regional hierarchy
-- ============================================================

CREATE TABLE IF NOT EXISTS region (
    region_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_name VARCHAR(200) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

CREATE TABLE IF NOT EXISTS region_manager (
    rm_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    region_id UUID NOT NULL REFERENCES region(region_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS service_provider (
    sp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    dob DATE,
    address TEXT,
    city VARCHAR(100) NOT NULL DEFAULT 'Chennai',
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
    rating NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    account_status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deactivated', 'pending')),
    deactivation_requested BOOLEAN NOT NULL DEFAULT FALSE,
    hour_start TIME NOT NULL DEFAULT '07:00',
    hour_end TIME NOT NULL DEFAULT '23:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    region_id UUID REFERENCES region(region_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS customer (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    dob DATE,
    address TEXT,
    city VARCHAR(100) NOT NULL DEFAULT 'Chennai',
    rating NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS revenue_ledger (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (payout_status IN ('PENDING', 'DISBURSED', 'CANCELLED')),
    provider_amount NUMERIC(12,2) NOT NULL CHECK (provider_amount >= 0),
    platform_amount NUMERIC(12,2) NOT NULL CHECK (platform_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    booking_id UUID NOT NULL,
    service_id UUID NOT NULL,
    sp_id UUID NOT NULL REFERENCES service_provider(sp_id) ON DELETE RESTRICT,
    rm_id UUID NOT NULL REFERENCES region_manager(rm_id) ON DELETE RESTRICT
);
