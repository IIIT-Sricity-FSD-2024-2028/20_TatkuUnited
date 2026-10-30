# Booking UI and workflow verification

Verified on 30 October 2026 against the existing NestJS/Mongoose implementation.

## Changes by section

| Section | Reused and changed | Verification |
| --- | --- | --- |
| 0 — Schema | Kept existing nullable provider, offer history, matching settings and indexes. Added `disputed` and optional `completionRejectedAt`. Corrected frontend payment/provider types. | Four schema tests pass. Server connects to MongoDB; health/settings endpoints respond. |
| 1 — Schedule | Kept existing scheduling/address flow. Clear stale slots while loading; show unavailable state when every returned slot is unavailable. | Real available-slots endpoint returns empty slots and no-provider message. |
| 2 — Cart | Kept checkout and existing cart components; removed nested public navbar/footer. | Empty checkout returns 400. |
| 3 — Payment | Replaced oversized simulator UI with shared Card/Button/Badge components. Failed/expired orders return to cart for a new checkout. Paid/refunded/partially refunded states persist on reload and hide payment buttons. | Failure and late-payment HTTP checks; browser verified a refunded order has no payment controls. |
| 4 — Assignment | Reused matching and provider offers. Partially refunded orders continue matching their remaining bookings. Missing services/invalid locations consume bounded matching rounds. Added visible offer-refresh errors and action locks; simplified offer styling. | Three exhausted rounds cancel and fully refund; partial-refund order also reaches a terminal state. |
| 5 — Completion | Customer denial atomically enters disputed, records its timestamp and notifies administrators. Repeated provider requests, direct completion and general PATCH bypass are blocked. Regional managers/admins retain completion override. Assigned Jobs polls every six seconds instead of on every render. | Real request/deny/repeat/confirm/override and role-guard checks pass. |
| 9 — Pages | Booking history/detail and payment use the existing dashboard shell and shadcn components. Added My Bookings navigation, corrected rebooking navigation, and removed duplicate public chrome from feedback. Booking status polling and missing-record/error states are included. | Browser login with existing test customer; booking list and refunded payment page visually inspected. |

## Actual HTTP output (selected)

```text
GET / -> 200 "Hello World!"
GET /platform-settings -> 200 {"offerBatchSize":5,"maxOfferRounds":3}
GET /services/:id/available-slots -> 200 {"date":"2026-10-31","slots":[],"message":"No eligible service providers in your area for this date"}
POST /orders/checkout -> 400 {"message":"Shopping cart is empty","error":"Bad Request","statusCode":400}
POST /bookings/:id/request-completion -> 200 {"status":"completion_requested","payoutStatus":"pending","completionRejectedAt":null}
POST /bookings/:id/reject-completion -> 200 {"status":"disputed","payoutStatus":"pending","completionRejectedAt":"2026-10-30T03:35:36.790Z"}
POST /bookings/:id/request-completion -> 400 {"message":"Only an in-progress assigned booking can request completion","error":"Bad Request","statusCode":400}
POST /bookings/:id/complete (provider) -> 403
PATCH /bookings/:id (provider) -> 403
POST /bookings/:id/cancel (provider, disputed) -> 400
POST /bookings/:id/complete (admin) -> 201 {"status":"completed","payoutStatus":"pending"}
POST /bookings/:id/confirm-completion -> 200 {"status":"completed","payoutStatus":"pending","completionRejectedAt":null}
POST /payments/simulate -> 201 {"success":false,"paymentStatus":"failed","message":"Payment failed. You may retry your checkout from the cart."}
GET /orders/:id/details -> 200 {"paymentStatus":"failed"}
POST /payments/simulate (expired order) -> 201 {"success":false,"paymentStatus":"refunded","message":"Order expired before payment. Payment not confirmed and refund recorded."}
GET /bookings/:id -> 200 {"status":"cancelled","reason":"no provider available","offerRound":2,"paymentStatus":"refunded"}
GET /bookings/:id (previously partially refunded order) -> 200 {"status":"cancelled","paymentStatus":"refunded"}
```

Full captured output: `../scratch/booking-ui-verification-output.txt`.

## Reproduce

From `back-end`:

```powershell
node node_modules/@nestjs/cli/bin/nest.js build
node node_modules/jest/bin/jest.js booking-workflow.spec.ts --runInBand
node --env-file=.env scratch/verify-booking-ui-flow.cjs
```

The HTTP verification starts the real Nest application with authentication guards, seeds an isolated randomly named MongoDB database, calls its endpoints, and removes its fixtures. It directly invokes the real matching service/sweep to avoid waiting for the background timer. The configured MongoDB account must permit fixture reads/writes in that database. Empty test database collections may remain because this account cannot drop databases.

Frontend TypeScript and Vite production builds pass. Backend build passes. Two pre-existing unused frontend declarations were also removed to allow the TypeScript build to finish.

## Stubs and limits

- No new production stubs or dependencies. Payments/refunds still use the existing mock gateway; no real money was moved.
- Test users, orders and bookings are fixtures. Test JWTs are signed using the configured application's JWT service. UI verification used the existing test customer's login.
- Disputes need manual review through the existing manager/admin completion override. No automatic decision, refund policy, dispute-resolution screen or new payout processor was added.
- Sections 6–8 were not rebuilt. The complete original acceptance checklist (including payout, review aggregation and concurrent provider acceptance) was not rerun; these checks cover the changes and the reported edge cases.
- No migration of historical bookings or destructive index replacement was performed. Legacy awaiting-provider records that already have a provider require a separate data migration decision.
