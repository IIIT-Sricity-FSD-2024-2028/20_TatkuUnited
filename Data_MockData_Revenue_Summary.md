# Tatku United: Data, mockData, and Revenue Logic Summary

## 1. How data and mockData are handled

- Runtime source of truth is AppStore in front-end/js/data/store.js.
- Startup flow:
  - Try restore from localStorage key fsd_store.
  - If missing, fetch front-end/js/data/mockData.json.
  - Deep-clone into AppStore.data.
  - Persist immediately via AppStore.save().
- Most pages wait for AppStore.ready before rendering logic.
- Some pages still have fallback fetch logic to read mockData.json directly if AppStore is unavailable.
- AppStore.getTable() only allows predefined table names (guarded access).
- Runtime writes happen to localStorage/session state, not back into the mockData file.
- Startup hygiene pass in store.js:
  - normalizes legacy IN_PROGRESS assignments/bookings to ASSIGNED or COMPLETED/CONFIRMED.
  - upserts revenue_ledger rows only for provider-assigned tasks in ASSIGNED or COMPLETED state with SUCCESS transactions.

## 2. Mutation and state management logic

- CRUD operations (create/update/delete) in front-end/js/modules/crud.js:
  - mutate target table from AppStore.getTable()
  - call AppStore.save()
- Assignment and provider workflow updates mutate AppStore-backed data and persist.
- Customer state is normalized under customer_state:
  - carts per customer
  - checkout_meta per customer
- Legacy keys (tu*cart, tu_last*\*) are migrated into customer_state and then cleared.
- Legacy UI bridge exists through window.getData() / window.setData() (fsd_ui_state), mainly for provider-side compatibility.

## 3. mockData.json snapshot summary

Current mock data includes core business domains:

- Geography and org hierarchy: sectors, collectives, units.
- Users and roles: customers, service_providers, unit_managers, collective_managers, super_users.
- Service catalog: categories, services, service_content, service_faqs, skills, service_skills.
- Packaging: service_packages, package_services.
- Operations: bookings, booking_services, job_assignments.
- Payments and accounting: transactions, revenue_ledger.
- Reviews and super-user support tables.

Notable seeded behavior in the current mock data:

- Ratings are derived from assignment_score (documented in rating_computation_note).
- Transactions include SUCCESS, PENDING, and REFUNDED states.
- revenue_ledger starts empty and is populated dynamically by RevenueManager.

## 4. Revenue split logic (core)

Defined in front-end/js/utils/revenue-ledger-generator.js:

- Provider: 78%
- Unit Manager: 7%
- Collective Manager: 4%
- Super User (platform): 11%

Computation per role:

- amount = round(transaction.amount _ split _ 100) / 100
- Stored as separate revenue_ledger entry per role.

For each eligible successful booking transaction, system creates 4 ledger rows:

- provider row
- unit_manager row
- collective_manager row
- super_user row

## 5. Revenue lifecycle and triggers

Booking time (checkout):

- checkout creates transaction with payment_status = SUCCESS for paid flow.
- provider auto-assignment runs.
- RevenueManager.ensureLedgerEntriesForBooking(...) creates initial ledger entries with payout_status = PENDING.

Startup reconciliation (pre-existing records):

- AppStore startup rebuilds/updates ledger rows for existing ASSIGNED and COMPLETED provider tasks that have SUCCESS transactions.
- ASSIGNED tasks are stored as payout_status = PENDING.
- COMPLETED tasks are stored as payout_status = PAID.

Completion time (provider side):

- when provider marks job completed, RevenueManager.markBookingPayoutPaid(bookingId) runs.
- existing booking ledger rows are flipped to PAID.
- payout_at is stamped.

Idempotency behavior:

- if ledger entries already exist for a booking transaction, generator updates payout status instead of duplicating rows.

## 6. Role-wise reporting usage

Provider earnings page:

- filters revenue_ledger where role = provider and matching provider_id.
- joins transactions for original amount and payment metadata.
- computes paid total, pending total, gross view, average booking value.

Unit manager revenue page:

- filters revenue_ledger where role = unit_manager and matching unit_id.
- uses transaction amount as GMV and ledger amount as manager cut.

Collective manager reports:

- filters role = collective_manager and matching collective_id.
- aggregates GMV and collective cut by unit and period.

Super user dashboard:

- aggregates ledger by role for distribution visibility.
- computes overall GMV from successful/completed transactions.

## 7. End-to-end logic flow

1. App starts -> AppStore restore or mockData fetch.
2. Customer books and pays -> booking + booking_services + transaction.
3. Assignment engine maps booking to provider by skills/availability.
4. Startup reconciliation ensures pre-existing assigned/completed provider tasks have matching ledger rows.
5. Runtime revenue manager creates/updates rows for new task progress and completion.
6. Role dashboards read revenue_ledger + transactions for analytics.

## 8. Important observations from current snapshot

- Plaintext seeded passwords are present in mockData.json (example shown in active selection). This is acceptable only for local demo data; avoid in any shared/public environment.
- Some icon text appears mojibake-encoded in category icon values, consistent with earlier encoding issues.
- Revenue logic currently assumes all successful transactions are split by the fixed 78/7/4/11 model.
- Pre-existing IN_PROGRESS booking/assignment seed states are now normalized to ASSIGNED/CONFIRMED or COMPLETED.

---

Prepared on: 2026-04-02
Workspace: 20_TatkuUnited
