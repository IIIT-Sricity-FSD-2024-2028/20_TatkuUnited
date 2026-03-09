-- ============================================================
-- TATKU UNITED — DB Init Entry Point
-- This file is auto-executed by PostgreSQL Docker on first boot.
-- It runs inside the `tatku_db` database created via POSTGRES_DB env var.
-- ============================================================

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- for gen_random_uuid() if needed later
-- CREATE EXTENSION IF NOT EXISTS postgis;   -- Uncomment if PostGIS image is used

-- Load the full schema
\i /docker-entrypoint-initdb.d/DBschema.sql
