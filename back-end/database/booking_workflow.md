# Booking Workflow: End-to-End Flow

**Stack (strict):** Express + Mongoose (back-end), React + react-router (front-end), plain JavaScript.
No new libraries (no Socket.IO, node-cron, Redux, payment SDKs). Use polling for live updates and `setInterval` for background jobs.

**Before coding:**

1. Read `back-end/database/db_docs.md` and the existing models, routes, controllers and pages.
2. Reuse what already exists (auth, role middleware, models, seed data, Service/Services pages). Do not rebuild it.
3. Where this document differs from `db_docs.md` (provider assignment), **this document wins**. Update the models and the doc accordingly.
4. Work in the order of the sections below. After each section, run the server, call the endpoints and show real output. List anything you stubbed.

---

## 0. Key decision: first-accept assignment

`db_docs.md` auto-assigns a provider at checkout. This flow instead **offers the job to several providers after payment, and the first one to accept gets it.**

Required schema changes:

- `Booking.provider` is nullable until a provider accepts.
- `Booking.status` gets a new value `awaiting_provider` (set at order creation, before anyone accepts).
- `Booking.offers: [{ provider, status: offered|declined|expired|accepted, offeredAt, expiresAt }]`
- `Booking.offerRound: Number` (default 0)
- `Booking.completedAt: Date`
- New `Notification` model: `user, type, booking, message, readAt`, index `{user, readAt, createdAt}`.
- `PlatformSetting` gets: `offerTimeoutMinutes` (5), `maxOfferRounds` (3), `offerBatchSize` (5), `payoutHoldHours` (0), `matchWeights {distance: 0.4, rating: 0.4, availability: 0.2}`.
- Indexes: `Booking {status, "offers.provider"}`, `Booking {provider, scheduledDate, status}`, `Provider.location` 2dsphere (GeoJSON, so `2dsphere`, not legacy `2d`).
- Provider overlap checks count only bookings with `provider` set and status in `[confirmed, in_progress]`. `awaiting_provider` bookings have no provider yet.

---

## 1. Book now -> Schedule

1. "Book now" on `/services` and in `ServicePage` navigates to `/customer/schedule/:service_id`.
2. The route is protected (customer only). If logged out, go to `/login`, then return to this page.
3. The page loads the service (name, price, duration) and the customer's saved addresses.
4. The customer **must select one saved address** (radio list, with an "Add address" option). Slots do not load until an address is chosen.
5. The customer picks a future date. The page then shows available start-time slots. A slot is shown only if at least one eligible provider exists for it (rules in section 4, step 2).
6. The customer picks a slot. `endTime = startTime + service.duration`. Times are minutes from midnight.
7. "Add to cart" pushes `{service, scheduledDate, startTime, endTime}` into `User.cart.items` and sets `User.cart.address` to the chosen address id. **No prices in the cart.** Then navigate to `/customer/cart`.
8. The cart page lists items (price read from Service live), lets the customer remove items, and has a "Checkout" button.

---

## 2. Checkout

`POST checkout` runs in one Mongoose transaction:

1. Validate: cart not empty, `cart.address` exists, every service is `isActive`, every date is in the future, no two cart items overlap each other, and each slot still has at least one eligible provider.
2. Create one **Booking** per cart item: `status: awaiting_provider`, `provider: null`, `customer`, `service`, `scheduledDate/startTime/endTime`, `price` (from Service), `platformFeePercent` (from PlatformSetting), `platformShare = round(price * fee / 100)`, `providerShare = price - platformShare`, `payoutStatus: pending`, `region` (nearest active region to the address).
3. Create the **Order**: customer, address snapshot `{line, city, location}`, `totalAmount` (sum of booking prices), `paymentStatus: created`, `expiresAt = now + 15 min`.
4. Create the **Payment** (mock): `order`, `totalAmount`, `currency: "INR"`, `razorpayOrderId: "mock_order_<id>"`, `refunds: []`. Set `Order.payment`.
5. Return `{orderId, amount}`. The front-end goes to `/customer/pay/:orderId`.

All money is in paise. Prices always come from the server.

---

## 3. Mock payment

Put the mock behind a `paymentService` (`createOrder`, `simulate`, `refund`) so real Razorpay can replace it later.

`/customer/pay/:orderId` shows the amount and two buttons: **Pay successfully** and **Fail payment**.

**Success** (must be idempotent; if the order is already `paid`, return OK and do nothing):

- If the order has expired, do not confirm. Cancel its bookings and record a full refund on `Payment.refunds`.
- Otherwise, in a transaction: set mock `razorpayPaymentId` and signature on Payment, `Order.paymentStatus = paid`, clear `cart.items` and `cart.address`.
- After commit, run matching for each booking of the order (section 4).
- Booking status stays `awaiting_provider` until a provider accepts.
- Customer sees "Payment received, finding a provider".

**Failure:** `Order.paymentStatus = failed`, bookings cancelled (`cancelledBy: system`, reason "payment failed"). The cart stays so the customer can retry (a retry creates a new Order).

**Expiry job** (`setInterval`, every 60 s): find orders with `paymentStatus: created` and `expiresAt < now`. Mark them `failed` and cancel their bookings (`system`, "payment timeout").

---

## 4. Matching and notifying providers

`matchingService.offerBooking(bookingId)`:

1. Read the order address (`Order.address.location`) and `maxAssignmentDistanceKm`.
2. Candidate query, using `Provider.aggregate` with `$geoNear` on `location` (2dsphere, `spherical: true`, `maxDistance = km * 1000` metres, `distanceField: "dist"`). Query filter:
   - `status: approved`
   - `offeredServices` contains the service
   - `workingDays` contains the weekday of `scheduledDate`
   - `workHourStart <= startTime` and `workHourEnd >= endTime`
   - `_id` not in providers already offered or declined for this booking
3. In code, drop providers with an overlapping active booking (same date, `existing.startTime < new.endTime` and `existing.endTime > new.startTime`, status confirmed or in_progress) or an overlapping **Unavailability** (including recurring blocks, per db_docs 4.6).
4. Score each remaining provider:
   `score = w.distance * (1 - dist / maxDist) + w.rating * ratingScore + w.availability * (1 - dayLoad / dailyCapacity)`
   - `ratingScore` is a Bayesian-adjusted rating (so one 5-star review doesn't beat 200 reviews at 4.8). A new provider with no reviews gets a neutral value.
   - `dayLoad` is the provider's number of active bookings that day.
5. Take the top `offerBatchSize`. Push them into `Booking.offers` with `status: offered`, `expiresAt = now + offerTimeoutMinutes`. Create a `Notification` for each ("New job: <service>, <date/time>, <distance> km, earn ₹<providerShare>").
6. If no candidates exist, treat it as a failed round and go to the timeout handling below.

**Provider side** (polling, no sockets):

- The provider dashboard polls the offers endpoint every ~5 s and shows open offers (not expired, still `awaiting_provider`) with service, date/time, distance, area, and earnings (`providerShare`), plus **Accept** and **Decline**.
- A `NotificationBell` polls notifications every ~10 s.

**Accept** (the first provider wins). In a transaction:

1. Lock the provider: `Provider.updateOne({_id: me}, {$currentDate: {updatedAt: true}})`, so concurrent accepts conflict.
2. Re-check that the provider still has no overlapping booking or unavailability.
3. `Booking.findOneAndUpdate({_id, provider: null, status: "awaiting_provider", offers: {$elemMatch: {provider: me, status: "offered", expiresAt: {$gt: now}}}}, {provider: me, status: "confirmed"})` and mark my offer `accepted`, all other offers `expired`.
4. If this returns null, respond 409 "This job was already taken" and the UI removes the card.
5. Notify the customer ("Your provider is <name>") and the other offered providers ("Job taken").

**Decline:** mark my offer `declined`. I must never be offered this booking again.

**Offer-timeout job** (`setInterval`, every 30 s): for `awaiting_provider` bookings (paid orders only) whose open offers have all expired or been declined:

- Mark those offers `expired`, increment `offerRound`, widen the search radius (e.g. x1.5 per round), and run matching again, excluding earlier providers.
- After `maxOfferRounds` with no acceptance: cancel the booking (`cancelledBy: system`, reason "no provider available"), refund its price through `paymentService.refund()` (append to `Payment.refunds`), update `Order.paymentStatus` (`refunded` or `partially_refunded`), and notify the customer.

---

## 5. Job execution

- Only the **assigned provider** can change their booking (manager of the region or admin can override).
- Allowed transitions: `confirmed -> in_progress -> completed`. Anything else is rejected with 400.
- On `completed`: set `completedAt`, notify the customer ("Please rate your service"), and trigger payout (section 6).
- Customer is notified on start and completion.

**Provider cancels a confirmed job:** set `provider: null`, `status: awaiting_provider`, add that provider to the excluded list, reset `offerRound`, re-run matching, and notify the customer ("Finding you a new provider"). If matching ends with nobody, the timeout job auto-cancels and refunds.

---

## 6. Payout (mock, split by platform setting)

The split is already on the Booking (`providerShare`, `platformShare`, from the fee snapshot). Never recompute it from current settings.

`payoutService.pay(bookingId)`:

1. Preconditions: booking `completed`, `Order.paymentStatus` is `paid` (or `partially_refunded` and this booking was not refunded), `payoutStatus: pending`, and `completedAt + payoutHoldHours` has passed.
2. Atomic claim: `Booking.findOneAndUpdate({_id, status: "completed", payoutStatus: "pending"}, {payoutStatus: "paid", payoutAt: now})`. If null, stop (already paid). This guarantees no double payout.
3. Record the mock transfer (log it and notify the provider "₹X credited"). The platform keeps `platformShare`.
4. Call it right after completion, and also from a `payoutJob` (`setInterval`, every 5 min) that retries any completed booking still `pending` once the hold has passed.
5. Skip cancelled or refunded bookings.

(If a `razorpayAccountId` is required for real payouts, skip that check in mock mode but leave a clear TODO.)

---

## 7. Reviews and ratings

1. Allowed only when: the booking is `completed`, the requester is the booking's customer, and no review exists yet (unique index on `Review.booking`).
2. In one transaction:
   - Insert the Review (`booking`, `rating` 1 to 5, `review` text optional, `provider` and `service` copied from the booking).
   - `Provider.rating = (rating * ratingCount + new) / (ratingCount + 1)`, then `ratingCount += 1`.
   - `Service.rating` and `Service.reviewCount` the same way.
3. The customer's booking detail page shows a review form for completed, unreviewed bookings. The Service page lists reviews (newest first). The new rating immediately influences future matching scores.

---

## 8. Cancellation and refunds

Follow db_docs 4.13:

- Customer: may cancel while `awaiting_provider` or `confirmed`. Provider: may cancel `confirmed` (section 5). Manager/admin: any time before completed. Nobody can cancel a `completed` booking.
- If paid, compute the refund by policy (default: full refund when cancelled before `in_progress`), call `paymentService.refund()`, append `{booking, amount, razorpayRefundId, status, createdAt}` to `Payment.refunds`, and update `Order.paymentStatus`.
- Validate before refunding: total refunds never exceed `Payment.totalAmount`, and per-booking refunds never exceed `price`.
- Cancelled bookings are skipped by payout.

---

## 9. Pages and routes (front-end)

| Route                                          | Page                                         |
| ---------------------------------------------- | -------------------------------------------- |
| `/customer/schedule/:service_id`               | Schedule (address, date, slot, add to cart)  |
| `/customer/cart`                               | Cart and checkout                            |
| `/customer/pay/:orderId`                       | Mock payment                                 |
| `/customer/bookings`, `/customer/bookings/:id` | History, status, cancel, review form         |
| `/provider/offers`                             | Open offers with Accept / Decline            |
| `/provider/jobs`                               | Assigned jobs with Start / Complete / Cancel |

Add a shared `NotificationBell` and a `usePolling` hook. Wrap routes with a role-aware `ProtectedRoute`. Reuse existing API client and auth context.

---

## 10. Cross-cutting rules

- Filter every query by the authenticated user. Never trust ids from the client. Never return `password`.
- Use transactions for checkout, payment success, accept, cancel and review.
- Start all background jobs (order expiry, offer timeout, payout) in `server.js` after the DB connects.
- Snapshots (`price`, `platformFeePercent`, `Order.address`) are never updated after creation.

---

## 11. Acceptance checklist (run these and show results)

1. Full happy path: book, pay, offers appear, one provider accepts, start, complete, payout, review, ratings update.
2. Two providers press Accept at the same time: exactly one succeeds, the other gets 409.
3. Click "Pay successfully" twice: only one state change, no duplicate matching or notifications.
4. Pay after the order expired: no confirmation, full refund recorded.
5. Nobody accepts: re-offers with a wider radius, then auto-cancels and refunds.
6. Provider cancels after accepting: the booking returns to `awaiting_provider`, a different provider can accept.
7. Two overlapping items in one cart: rejected at add-to-cart or checkout.
8. Payout runs twice (completion hook plus job): paid once only.
9. Second review on the same booking: rejected.
10. Provider with an overlapping booking or Unavailability block never receives the offer.
