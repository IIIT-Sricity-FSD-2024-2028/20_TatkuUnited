# TATKU UNITED — Local DB Setup

## Folder Structure

```
tatku-db/
├── docker-compose.yml
└── init/
    ├── 01_init.sql      ← entry point (auto-run by Docker)
    └── DBschema.sql     ← full schema (called from 01_init.sql)
```

## First-Time Setup (Fresh Spin-Up)

```bash
docker compose up -d
```

Docker will:
1. Pull `postgres:16` image
2. Create the `tatku_db` database
3. Auto-run everything in `init/` — applying your full schema

## Verify Tables Were Created

```bash
docker exec -it tatku_db psql -U tatku_user -d tatku_db -c "\dt"
```

## Connect with psql

```bash
docker exec -it tatku_db psql -U tatku_user -d tatku_db
```

## Teardown (Wipe & Rebuild Clean)

```bash
docker compose down -v        # stops container AND deletes volume (clean slate)
docker compose up -d          # fresh spin-up, schema re-applied automatically
```

> ⚠️ `-v` removes the named volume (all data). Use without `-v` to just stop/restart.

## Connection String (for your app)

```
postgresql://tatku_user:tatku_pass@localhost:5432/tatku_db
```

## Credentials

| Key      | Value        |
|----------|--------------|
| Host     | localhost    |
| Port     | 5432         |
| DB       | tatku_db     |
| User     | tatku_user   |
| Password | tatku_pass   |

> Change these in `docker-compose.yml` before deploying to staging/production.
