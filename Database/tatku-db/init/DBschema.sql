-- ============================================================
-- TATKU UNITED — Production Database Schema v2.1
-- Digital Marketplace for Non-Retail Services
-- PostgreSQL DDL | March 2026
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
-- Uncomment if PostGIS is available for spatial indexing:
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- TABLE: Sector
-- ============================================================
CREATE TABLE Sector (
    sector_id        BIGINT          PRIMARY KEY,   -- H3-compatible stable hex cell ID
    sector_name      VARCHAR(100)    NOT NULL UNIQUE,
    h3_index         VARCHAR(20)     NOT NULL UNIQUE,
    resolution       SMALLINT        NOT NULL DEFAULT 8,
    state            VARCHAR(100)    NOT NULL,
    region           VARCHAR(100),
    centroid_lat     DECIMAL(9,6)    NOT NULL,
    centroid_lng     DECIMAL(9,6)    NOT NULL,
    boundary_geojson TEXT,
    density_tier     VARCHAR(20)     CHECK (density_tier IN ('Urban','Semi','Rural')),
    is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: Collective_Manager
-- ============================================================
CREATE TABLE Collective_Manager (
    collective_manager_id BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                  VARCHAR(200) NOT NULL,
    phone                 VARCHAR(20)  NOT NULL UNIQUE,
    email                 VARCHAR(254) UNIQUE,
    is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: Collective
-- ============================================================
CREATE TABLE Collective (
    collective_id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    collective_name       VARCHAR(200) NOT NULL,
    collective_manager_id BIGINT       NOT NULL REFERENCES Collective_Manager(collective_manager_id),
    state                 VARCHAR(100) NOT NULL,
    is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: Collective_Sector (Junction)
-- ============================================================
CREATE TABLE Collective_Sector (
    collective_id BIGINT      NOT NULL REFERENCES Collective(collective_id),
    sector_id     BIGINT      NOT NULL REFERENCES Sector(sector_id),
    assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (collective_id, sector_id)
);

-- ============================================================
-- TABLE: Unit_Manager
-- ============================================================
CREATE TABLE Unit_Manager (
    unit_manager_id BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    phone           VARCHAR(20)  NOT NULL UNIQUE,
    email           VARCHAR(254) UNIQUE,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: Unit
-- ============================================================
CREATE TABLE Unit (
    unit_id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    collective_id   BIGINT      NOT NULL REFERENCES Collective(collective_id),
    unit_name       VARCHAR(200) NOT NULL,
    unit_manager_id BIGINT      NOT NULL REFERENCES Unit_Manager(unit_manager_id),
    rating          DECIMAL(3,2) CHECK (rating BETWEEN 0 AND 5),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: Service_Provider
-- ============================================================
CREATE TABLE Service_Provider (
    service_provider_id BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    unit_id             BIGINT      REFERENCES Unit(unit_id),           -- NULL = independent provider
    sector_id           BIGINT      NOT NULL REFERENCES Sector(sector_id),
    name                VARCHAR(200) NOT NULL,
    phone               VARCHAR(20)  NOT NULL UNIQUE,
    email               VARCHAR(254) UNIQUE,
    dob                 DATE,
    address             TEXT,
    latitude            DECIMAL(9,6),
    longitude           DECIMAL(9,6),
    gender              VARCHAR(10)  CHECK (gender IN ('Male','Female','Other')),
    resume              TEXT,
    track_record        TEXT,
    achievements        TEXT,
    timezone            VARCHAR(60)  NOT NULL DEFAULT 'Asia/Kolkata',
    otp_secret          VARCHAR(64),
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: Skill
-- ============================================================
CREATE TABLE Skill (
    skill_id    BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    skill_name  VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ============================================================
-- TABLE: Provider_Skill (Junction)
-- ============================================================
CREATE TABLE Provider_Skill (
    service_provider_id BIGINT      NOT NULL REFERENCES Service_Provider(service_provider_id),
    skill_id            BIGINT      NOT NULL REFERENCES Skill(skill_id),
    verified_at         TIMESTAMPTZ,
    PRIMARY KEY (service_provider_id, skill_id)
);

-- ============================================================
-- TABLE: Provider_Working_Hours
-- ============================================================
CREATE TABLE Provider_Working_Hours (
    working_hour_id     BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    service_provider_id BIGINT      NOT NULL REFERENCES Service_Provider(service_provider_id),
    day_of_week         SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    hour_start          SMALLINT    NOT NULL CHECK (hour_start BETWEEN 0 AND 23),
    hour_end            SMALLINT    NOT NULL CHECK (hour_end BETWEEN 1 AND 24),
    is_working          BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (service_provider_id, day_of_week),
    CHECK (hour_end > hour_start)
);

-- ============================================================
-- TABLE: Provider_Unavailability
-- ============================================================
CREATE TABLE Provider_Unavailability (
    unavailability_id        BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    service_provider_id      BIGINT      NOT NULL REFERENCES Service_Provider(service_provider_id),
    date                     DATE        NOT NULL,
    hour_start               SMALLINT    CHECK (hour_start BETWEEN 0 AND 23),
    hour_end                 SMALLINT    CHECK (hour_end BETWEEN 1 AND 24),
    reason                   VARCHAR(200),
    is_recurring             BOOLEAN     NOT NULL DEFAULT FALSE,
    recurrence_rule          VARCHAR(200),
    recurrence_end_date      DATE,
    parent_unavailability_id BIGINT      REFERENCES Provider_Unavailability(unavailability_id),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Both hour_start/end must be NULL (full day) or both NOT NULL (partial day)
    CHECK (
        (hour_start IS NULL AND hour_end IS NULL) OR
        (hour_start IS NOT NULL AND hour_end IS NOT NULL)
    )
);

-- ============================================================
-- TABLE: Category
-- ============================================================
CREATE TABLE Category (
    category_id        BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    parent_category_id BIGINT      REFERENCES Category(category_id),
    category_name      VARCHAR(200) NOT NULL,
    description        TEXT,
    icon               VARCHAR(255),
    is_active          BOOLEAN     NOT NULL DEFAULT TRUE,
    UNIQUE (parent_category_id, category_name)
);

-- ============================================================
-- TABLE: Service
-- ============================================================
CREATE TABLE Service (
    service_id             BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id            BIGINT      NOT NULL REFERENCES Category(category_id),
    skill_id               BIGINT      NOT NULL REFERENCES Skill(skill_id),
    service_name           VARCHAR(200) NOT NULL,
    description            TEXT,
    base_price             DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    estimated_duration_min INTEGER     NOT NULL CHECK (estimated_duration_min > 0),
    is_active              BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: Customer
-- ============================================================
CREATE TABLE Customer (
    customer_id BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    phone       VARCHAR(20)  NOT NULL UNIQUE,
    email       VARCHAR(254) UNIQUE,
    dob         DATE,
    address     TEXT,
    latitude    DECIMAL(9,6),
    longitude   DECIMAL(9,6),
    rating      DECIMAL(3,2) CHECK (rating BETWEEN 0 AND 5),
    notes       TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: Service_Package
-- ============================================================
CREATE TABLE Service_Package (
    package_id             BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    package_name           VARCHAR(200) NOT NULL,
    description            TEXT,
    price                  DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    package_type           VARCHAR(20)  NOT NULL CHECK (package_type IN ('Predefined','Custom')),
    created_by_customer_id BIGINT      REFERENCES Customer(customer_id),  -- NULL = platform-defined
    is_active              BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: Package_Service (Junction)
-- ============================================================
CREATE TABLE Package_Service (
    package_id BIGINT   NOT NULL REFERENCES Service_Package(package_id),
    service_id BIGINT   NOT NULL REFERENCES Service(service_id),
    quantity   SMALLINT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    PRIMARY KEY (package_id, service_id)
);

-- ============================================================
-- TABLE: Booking
-- ============================================================
CREATE TABLE Booking (
    booking_id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id         BIGINT      NOT NULL REFERENCES Customer(customer_id),
    sector_id           BIGINT      NOT NULL REFERENCES Sector(sector_id),
    booking_type        VARCHAR(20) NOT NULL CHECK (booking_type IN ('Instant','Scheduled','Recurring')),
    recurrence_rule     VARCHAR(200),
    recurrence_end_date DATE,
    parent_booking_id   BIGINT      REFERENCES Booking(booking_id),
    service_address     TEXT        NOT NULL,
    service_lat         DECIMAL(9,6),
    service_lng         DECIMAL(9,6),
    scheduled_at        TIMESTAMPTZ,                      -- NULL for Instant bookings
    slot_locked_until   TIMESTAMPTZ,                      -- Soft-lock expiry during payment
    lock_held_by        VARCHAR(100),                     -- Node/process ID holding the lock (v2.1)
    otp_code            VARCHAR(10),
    otp_verified_at     TIMESTAMPTZ,
    status              VARCHAR(30) NOT NULL CHECK (status IN (
                            'Pending','Assigned','In-Progress',
                            'Completed','Failed','Reassigned','Cancelled'
                        )),
    version             INTEGER     NOT NULL DEFAULT 1,   -- Optimistic concurrency counter (v2.1)
    failure_reason      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: Booking_Package (Junction)
-- ============================================================
CREATE TABLE Booking_Package (
    booking_id       BIGINT        NOT NULL REFERENCES Booking(booking_id),
    package_id       BIGINT        NOT NULL REFERENCES Service_Package(package_id),
    price_at_booking DECIMAL(10,2) NOT NULL,   -- Immutable price snapshot at booking time
    PRIMARY KEY (booking_id, package_id)
);

-- ============================================================
-- TABLE: Job_Assignment
-- ============================================================
CREATE TABLE Job_Assignment (
    assignment_id       BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id          BIGINT      NOT NULL REFERENCES Booking(booking_id),
    service_provider_id BIGINT      NOT NULL REFERENCES Service_Provider(service_provider_id),
    scheduled_date      DATE        NOT NULL,
    hour_start          SMALLINT    NOT NULL CHECK (hour_start BETWEEN 0 AND 23),
    hour_end            SMALLINT    NOT NULL CHECK (hour_end BETWEEN 1 AND 24),
    status              VARCHAR(30) NOT NULL CHECK (status IN (
                            'Assigned','In-Progress','Completed',
                            'Failed','Cancelled','Rescheduled'
                        )),
    version             INTEGER     NOT NULL DEFAULT 1,   -- Optimistic concurrency counter (v2.1)
    assignment_score    DECIMAL(5,4),
    notes               TEXT,
    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Hard DB-level guard against double-booking
    UNIQUE (service_provider_id, scheduled_date, hour_start),
    CHECK (hour_end > hour_start)
);

-- ============================================================
-- TABLE: Transaction
-- ============================================================
CREATE TABLE Transaction (
    transaction_id      BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id          BIGINT        NOT NULL UNIQUE REFERENCES Booking(booking_id),  -- 1:1 per booking
    payment_method      VARCHAR(50)   NOT NULL,
    payment_gateway_ref VARCHAR(255),
    idempotency_key     VARCHAR(255)  UNIQUE,          -- Deduplication key from gateway (v2.1)
    payment_status      VARCHAR(20)   NOT NULL CHECK (payment_status IN (
                            'Pending','Completed','Failed','Refunded'
                        )),
    amount              DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency            CHAR(3)       NOT NULL DEFAULT 'INR',
    refund_amount       DECIMAL(10,2) DEFAULT 0 CHECK (refund_amount >= 0),
    refund_reason       TEXT,
    transaction_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: Notification
-- ============================================================
CREATE TABLE Notification (
    notification_id BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipient_type  VARCHAR(30) NOT NULL CHECK (recipient_type IN (
                        'Customer','Provider','UnitManager','CollectiveManager'
                    )),
    recipient_id    BIGINT      NOT NULL,
    booking_id      BIGINT      REFERENCES Booking(booking_id),
    channel         VARCHAR(20) NOT NULL CHECK (channel IN ('Push','SMS','Email','InApp')),
    event_type      VARCHAR(60) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    body            TEXT        NOT NULL,
    sent_at         TIMESTAMPTZ,        -- NULL = not yet delivered
    read_at         TIMESTAMPTZ,        -- NULL = unread
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: ServiceFAQ
-- ============================================================
CREATE TABLE ServiceFAQ (
    faq_id        BIGINT  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    service_id    BIGINT  NOT NULL REFERENCES Service(service_id),
    question      TEXT    NOT NULL,
    answer        TEXT    NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- TABLE: Review
-- ============================================================
CREATE TABLE Review (
    review_id     BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id    BIGINT      NOT NULL UNIQUE REFERENCES Booking(booking_id),  -- 1 review per booking
    reviewer_type VARCHAR(20) NOT NULL CHECK (reviewer_type IN ('Customer','Provider')),
    reviewer_id   BIGINT      NOT NULL,
    reviewee_type VARCHAR(20) NOT NULL CHECK (reviewee_type IN ('Customer','Provider','Unit')),
    reviewee_id   BIGINT      NOT NULL,
    rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: Complaint
-- ============================================================
CREATE TABLE Complaint (
    complaint_id     BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id       BIGINT      REFERENCES Booking(booking_id),   -- Optional
    raised_by_type   VARCHAR(30) NOT NULL CHECK (raised_by_type IN ('Customer','Provider','Unit_Manager')),
    raised_by_id     BIGINT      NOT NULL,
    against_type     VARCHAR(30) NOT NULL CHECK (against_type IN ('Customer','Provider','Unit_Manager')),
    against_id       BIGINT      NOT NULL,
    complaint_text   TEXT        NOT NULL,
    complaint_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
    assigned_to      BIGINT,     -- Manager ID handling the complaint
    status           VARCHAR(20) NOT NULL CHECK (status IN ('Open','Under Review','Resolved','Closed')),
    resolution_notes TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: Audit_Log
-- ============================================================
CREATE TABLE Audit_Log (
    log_id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_name      VARCHAR(100) NOT NULL,
    record_id       BIGINT       NOT NULL,
    operation       VARCHAR(10)  NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
    changed_by_type VARCHAR(30)  NOT NULL,
    changed_by_id   BIGINT       NOT NULL,
    old_values      JSONB,
    new_values      JSONB,
    changed_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================

-- § Provider Discovery (hottest read path)
CREATE INDEX idx_sp_sector_active
    ON Service_Provider (sector_id)
    WHERE is_active = TRUE;

-- Spatial proximity scoring (requires PostGIS; fallback below)
-- CREATE INDEX idx_sp_location ON Service_Provider USING GIST (ST_MakePoint(longitude, latitude));
CREATE INDEX idx_sp_location
    ON Service_Provider (latitude, longitude);   -- fallback without PostGIS

CREATE INDEX idx_ps_skill
    ON Provider_Skill (skill_id, service_provider_id);

-- § Booking Queries
CREATE INDEX idx_booking_customer
    ON Booking (customer_id, created_at DESC);

CREATE INDEX idx_booking_active_status
    ON Booking (status, sector_id)
    WHERE status IN ('Pending', 'Assigned', 'In-Progress');

CREATE INDEX idx_booking_scheduled
    ON Booking (sector_id, scheduled_at)
    WHERE status NOT IN ('Cancelled', 'Failed');

CREATE INDEX idx_booking_lock_expiry
    ON Booking (slot_locked_until)
    WHERE slot_locked_until IS NOT NULL;

-- § Job Assignment
-- NOTE: The UNIQUE constraint above creates idx_ja_provider_slot automatically.
-- Explicit form shown here for clarity; do not duplicate if UNIQUE already exists.
-- CREATE UNIQUE INDEX idx_ja_provider_slot ON Job_Assignment (service_provider_id, scheduled_date, hour_start);

CREATE INDEX idx_ja_booking
    ON Job_Assignment (booking_id);

-- § Supporting Tables
CREATE INDEX idx_pwh_provider
    ON Provider_Working_Hours (service_provider_id, day_of_week);

CREATE INDEX idx_unavail_provider_date
    ON Provider_Unavailability (service_provider_id, date);

CREATE INDEX idx_notif_recipient
    ON Notification (recipient_type, recipient_id, created_at DESC);

CREATE INDEX idx_txn_gateway_ref
    ON Transaction (payment_gateway_ref)
    WHERE payment_gateway_ref IS NOT NULL;

CREATE INDEX idx_audit_entity
    ON Audit_Log (table_name, record_id, changed_at DESC);

CREATE INDEX idx_sector_h3
    ON Sector (h3_index);

CREATE INDEX idx_cs_sector
    ON Collective_Sector (sector_id);


-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON COLUMN Booking.version IS
    'Optimistic concurrency counter. Every status transition must check AND increment this value (CAS pattern).';

COMMENT ON COLUMN Job_Assignment.version IS
    'Optimistic concurrency counter for CAS-based status transitions.';

COMMENT ON COLUMN Transaction.idempotency_key IS
    'Deduplication key from payment gateway. Prevents duplicate webhook processing.';

COMMENT ON COLUMN Booking.slot_locked_until IS
    'Soft-lock expiry. Set to NOW()+10min when customer selects slot. Cleared on payment failure.';

COMMENT ON COLUMN Booking.lock_held_by IS
    'Optional node/process ID holding the soft lock. Aids debugging in distributed deployments.';

COMMENT ON TABLE Audit_Log IS
    'Append-only audit trail. Populate via database triggers on sensitive tables.';

COMMENT ON TABLE Provider_Unavailability IS
    'Exceptions to the default weekly schedule. Full availability = Working_Hours - Unavailability - Job_Assignments.';

-- ============================================================
-- END OF SCHEMA
-- TATKU United | Database Schema v2.1 | March 2026 | Confidential
-- ============================================================