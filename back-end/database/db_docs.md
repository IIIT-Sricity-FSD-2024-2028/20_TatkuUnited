# Home Services Platform: Database Usage Guide

A practical guide to what each collection holds, who writes to it, and exactly what data to enter at each step of every process. Written for MongoDB (use a replica set or Atlas, because transactions are required).

---

## 1. Actors

| Actor | `User.role` | Extra document | What they do |
|---|---|---|---|
| Customer | `customer` | none | Browse, fill cart, pay, review, cancel |
| Service Provider | `provider` | `Provider` | Gets assigned jobs, performs them, sets availability |
| Regional Manager | `manager` | `Manager` | Approves providers, monitors bookings in their regions |
| Super User | `admin` | none | Configures the platform, creates catalogue, regions, managers |

Every person has exactly one `User` document. Provider and Manager are **profile documents** that point back to a User through `user`.

---

## 2. Global conventions

| Topic | Rule |
|---|---|
| IDs | MongoDB `_id` (ObjectId). `id string pk` in the diagram means `_id`. |
| Timestamps | Enable `timestamps: true` on every schema. This gives `createdAt` and `updatedAt` automatically. |
| Money | Integers in **paise** (₹499 is `49900`). Never use floats. Currency is `"INR"`. |
| Percentages | Whole numbers or decimals such as `20` for 20%. Compute shares with `Math.round`. |
| Geo | Store `{ type: "Point", coordinates: [longitude, latitude] }`. **Longitude first.** Distances in `$nearSphere`/`$geoNear` are in **metres**. `maxAssignmentDistanceKm` must be multiplied by 1000. |
| Time zone | The platform runs in one zone, `Asia/Kolkata`. Store instants (`startDateTime`, `expiresAt`, and so on) in UTC. |
| Slot date and time | `scheduledDate` is a date (midnight of the IST calendar day). `startTime` and `endTime` are **minutes from midnight** (9:30 AM is `570`). Use the same unit as `workHourStart` and `workHourEnd`. |
| Weekdays | `workingDays` uses `0 = Sunday … 6 = Saturday`. |
| Passwords | Store only a hash (bcrypt or argon2). |
| Snapshots | Copy values onto Booking and Order at creation (price, fee percent, address). Never recompute history from current Service or Setting values. |
| Referential integrity | MongoDB does not enforce `ref`. Your application must validate that referenced documents exist. |
| Deletion | Don't delete business data. Use `status` or `isActive` flags. |

### Enum reference

| Field | Values |
|---|---|
| `User.gender` | `male, female, other` |
| `User.role` | `customer, provider, manager, admin` |
| `User.status` | `active, blocked` |
| `Provider.status` | `pending, approved, suspended` |
| `Manager.status` | `active, suspended, inactive` |
| `Unavailability.recurringMode` | `none, daily, weekly, monthly` |
| `Order.paymentStatus` | `created, paid, failed, refunded, partially_refunded` |
| `Booking.status` | `pending, confirmed, in_progress, completed, cancelled` |
| `Booking.cancelledBy` | `customer, provider, manager, admin, system` |
| `Booking.payoutStatus` | `pending, paid` |
| `Payment.refunds[].status` | `initiated, processed, failed` |

---

## 3. Collections reference

### 3.1 PlatformSetting (single document)

Created once by the admin before anything else.

| Field | Notes |
|---|---|
| `platformFeePercent` | Platform commission. The provider's share is `100 − platformFeePercent`, so there is no separate provider-fee field. |
| `maxAssignmentDistanceKm` | Maximum distance between a job address and a provider. |

Read it on every checkout. Changing it only affects **future** bookings.

### 3.2 User

| Field | Notes |
|---|---|
| `email`, `phone` | Unique indexes. Required for login and OTP. |
| `role`, `status` | Check both on every authenticated request. `blocked` users cannot log in or book. |
| `addresses[]` | Each entry needs a self-generated `id` (use an ObjectId string). `location` is GeoJSON. |
| `cart` | Embedded. `cart.address` holds the `id` of one entry in `addresses`. `cart.items[]` hold `{service, scheduledDate, startTime, endTime}`. |

The cart lives on the user: it is small, private, and always read with the user. It stores **no prices**; prices are read from Service at checkout.

### 3.3 Provider

| Field | Notes |
|---|---|
| `user` | Unique. The User must have `role: provider`. |
| `offeredServices[]` | Services this provider can perform (multikey index). |
| `workHourStart/End`, `workingDays` | Weekly availability window. |
| `location` | Home or base point. This drives `$near` job assignment. |
| `status` | Only `approved` providers can receive jobs. |
| `rating`, `ratingCount` | Running average, updated when a review is added (see §4.9). |
| `region` | Management grouping only. It plays no part in assignment. |
| `razorpayAccountId` | The linked account used for payouts. Required before the first payout, not before approval. |

### 3.4 Manager

| Field | Notes |
|---|---|
| `user` | Unique. The User must have `role: manager`. |
| `salary` | Paise. Informational only, because salary payments are not modelled. |
| `status` | `active` managers can act on their regions. |

One manager can own several regions (`Region.manager` points at the manager).

### 3.5 Region

A region is a management label, **not** a physical boundary.

| Field | Notes |
|---|---|
| `manager` | The manager responsible. |
| `location` | Centroid (see §4.2). The admin sets it at creation. After that it is recomputed from providers. |
| `isActive` | Inactive regions are skipped when matching addresses. |

### 3.6 Category and Service

Admin-managed catalogue. Customers only see `isActive: true` records.

| Field | Notes |
|---|---|
| `Service.price` | Paise. The current list price, copied to `Booking.price` at checkout. |
| `Service.duration` | Minutes. `endTime = startTime + duration`. |
| `Service.rating`, `reviewCount` | Stored counters, updated when reviews are added. |
| Embedded arrays | `howItWorks`, `faq`, `whatIsCovered`, `whatIsNotCovered`, `imageUrls`. These are static content, edited only by admin. |

To retire a service, set `isActive: false`. Existing bookings are unaffected.

### 3.7 Unavailability

Provider time off.

| Field | Notes |
|---|---|
| `startDateTime`, `endDateTime` | UTC instants for the first occurrence. |
| `recurringMode` | `none` is a single block. The others repeat. |
| `recurrenceEndDate` | Required when recurring. Without it the block repeats forever. |

Only the first occurrence is stored. Occurrences are calculated when checking availability (§4.6).

### 3.8 Order

The customer's checkout. It is created **before** payment and holds slots until it expires.

| Field | Notes |
|---|---|
| `customer` | The buyer. |
| `address` | Snapshot `{line, city, location}` copied from the chosen address. |
| `totalAmount` | The sum of all its bookings' `price`, in paise. |
| `payment` | Ref to Payment. Briefly `null` between order creation and Razorpay order creation. |
| `paymentStatus` | The only place where payment state lives. |
| `expiresAt` | Order creation time plus 15 minutes (configurable). |

### 3.9 Booking

One row per service per slot. An order with 3 services creates 3 bookings, possibly with 3 different providers.

| Field | Notes |
|---|---|
| `order`, `customer`, `service`, `provider`, `region` | All set at order creation. The provider is auto-assigned. |
| `scheduledDate`, `startTime`, `endTime` | The slot. |
| `price` | Snapshot of `Service.price`. |
| `platformFeePercent` | Snapshot of the setting. |
| `platformShare`, `providerShare` | `platformShare = round(price × fee / 100)`, `providerShare = price − platformShare`. |
| `payoutStatus`, `payoutAt` | Provider settlement. |
| `status`, `cancelledBy`, `cancelledReason` | Lifecycle. See §5. |

The job address is **not** on the Booking. Read it from `Booking.order → Order.address`. Use `$lookup` or populate in the provider's job view.

### 3.10 Payment

Gateway data only. One Payment per Order.

| Field | Notes |
|---|---|
| `order` | Unique index. |
| `totalAmount`, `currency` | Must equal the Order's total and `"INR"`. |
| `razorpayOrderId` | Unique index. This is how the webhook finds the Payment. |
| `razorpayPaymentId`, `razorpaySignature` | Filled on successful payment. |
| `refunds[]` | `{booking, amount, razorpayRefundId, status, createdAt}`. Append one entry per refund. |

### 3.11 Review

| Field | Notes |
|---|---|
| `booking` | Unique index (one review per booking). |
| `provider`, `service` | Copied from the booking so ratings can be aggregated directly. |
| `rating`, `review` | Rating 1–5, text optional. |

---

## 4. Process walkthroughs (what to write, and when)

### 4.1 Platform setup (Admin, once)

1. Insert the single **PlatformSetting** document with `platformFeePercent` and `maxAssignmentDistanceKm`.
2. Insert **Category** documents, then **Service** documents. Set `rating: 0`, `reviewCount: 0`.
3. Create managers. Insert a **User** (`role: manager`), then a **Manager** profile (`status: active`).
4. Insert **Region** documents with a manager, a starting `location` (a central point of the area), and `isActive: true`.

### 4.2 Provider onboarding (Provider, then Manager)

1. **Register.** Insert a **User** (`role: provider`, `status: active`).
2. **Create the Provider profile** with `status: pending`, `rating: 0`, `ratingCount: 0`, `offeredServices`, work hours, working days, and `location`.
3. **Assign the region.** Find the nearest active region (`$nearSphere` on `Region.location`) and set `Provider.region`. This lets the right manager see the application.
4. **Manager reviews** providers where `region ∈ their regions` and `status: pending`. Approving sets `status: approved`.
5. **Recompute the region centroid** after approval. Take the mean longitude and latitude of all `approved` providers in that region and update `Region.location`. Repeat when a provider in that region is suspended, re-approved, or moves.
6. **Add payout details** later. Set `razorpayAccountId` once the provider completes the Razorpay linked-account onboarding.

Notes:
- Do **not** auto-reassign existing providers when a centroid shifts. Region changes should be a manual action by the admin.
- A region with no approved providers keeps its admin-set `location`.
- The centroid is a plain average, which is fine for city-sized regions.

### 4.3 Customer registration

1. Insert a **User** (`role: customer`, `status: active`) with the password hash.
2. Push addresses into `User.addresses` (each with a generated `id` and GeoJSON `location`). Geocode on the client or server before saving.

### 4.4 Browsing

Read-only queries.
- Categories: `isActive: true`.
- Services: `category` match and `isActive: true`.
- Reviews of a service: `Review.find({service})`, sorted by `createdAt` descending.

### 4.5 Cart

All changes are updates to `User.cart`.
- **Add item:** push `{service, scheduledDate, startTime, endTime}`, where `endTime = startTime + service.duration`.
- **Select address:** set `cart.address` to an `addresses[].id`.
- **Remove item:** pull it by index or by value.
- Carts do **not** reserve slots. A cart item can become unavailable, which is why checkout re-checks everything.

### 4.6 Checking provider availability

Run this per cart item, both when showing slots and when checking out. A provider qualifies when **all** of these hold:

1. `status: "approved"`.
2. `offeredServices` contains the service.
3. Within `maxAssignmentDistanceKm × 1000` metres of the order address (`$nearSphere` or `$geoNear`, nearest first).
4. `workingDays` contains the weekday of `scheduledDate`.
5. `workHourStart ≤ startTime` and `endTime ≤ workHourEnd`.
6. No overlapping **active** booking. Overlap means an existing booking with `status ∈ [pending, confirmed, in_progress]` on the same date where `existing.startTime < new.endTime` **and** `existing.endTime > new.startTime`.
7. No overlapping **unavailability**. Convert the slot to UTC instants, then:
   - `none`: `start < slotEnd` and `end > slotStart`.
   - Recurring: for the requested day, build the block's occurrence (same time of day for `daily`, same weekday for `weekly`, same day of month for `monthly`). The occurrence must fall on or before `recurrenceEndDate` and on or after the original `startDateTime`. Then apply the same overlap test.

Pick the first (nearest) qualifying provider. You can break ties with a higher `rating`.

### 4.7 Checkout: creating the Order (the critical step)

Pre-checks: the cart is not empty, `cart.address` exists in `addresses`, every service is `isActive`, and every date is in the future.

**Step A: one transaction**

For each cart item:
1. Find a provider (§4.6). If none is found for any item, abort the whole checkout and tell the customer which slot failed.
2. **Lock the provider:** inside the transaction, update that Provider with `$currentDate: { updatedAt: true }` before inserting the booking. This forces two concurrent checkouts for the same provider to conflict, so one retries. Without it, two transactions can both pass the overlap check and insert overlapping bookings (write skew). The partial unique index only catches identical start times.
3. Find the nearest active region to the address: `Booking.region`.
4. Insert the **Booking**:
   - `status: "pending"`, `price` from Service, `platformFeePercent` from PlatformSetting
   - `platformShare` and `providerShare` calculated
   - `payoutStatus: "pending"`
   - `order`, `customer`, `service`, `provider`, `region`, and the slot

Then insert the **Order**: `customer`, address snapshot, `totalAmount` (sum of prices), `paymentStatus: "created"`, `expiresAt: now + 15 min`.

Commit.

**Step B: create the Razorpay order** (outside the transaction, because it's an external API call): `amount = totalAmount`, `currency = "INR"`, `receipt = Order._id`. If this fails, cancel the bookings (`cancelledBy: system`) and mark the Order `failed`.

**Step C: short transaction**
- Insert the **Payment**: `order`, `totalAmount`, `currency`, `razorpayOrderId`, `refunds: []`.
- Set `Order.payment` to the Payment id.

Return the `razorpayOrderId` and the amount to the client to open Razorpay Checkout.

### 4.8 Payment success

Use both the client verification call and the Razorpay webhook (`payment.captured`). The webhook is the source of truth, and both paths must be idempotent.

1. Verify the signature: HMAC-SHA256 of `razorpayOrderId|razorpayPaymentId` with your key secret must equal `razorpay_signature`. For webhooks, verify the webhook signature header with the webhook secret.
2. Find the **Payment** by `razorpayOrderId`.
3. If `Order.paymentStatus` is already `paid`, stop (duplicate event).
4. In a transaction:
   - Payment: set `razorpayPaymentId` and `razorpaySignature`.
   - Order: `paymentStatus: "paid"`.
   - All the order's bookings: `status: "confirmed"`.
   - Customer: clear `cart.items` and `cart.address`.
5. Notify the customer and the assigned providers.

**Late payment:** if the payment arrives after the order expired (bookings already cancelled), do not confirm. Refund it in full and record the refund on Payment.

### 4.9 Payment failure or expiry

- **Failure event:** set `Order.paymentStatus: "failed"` and cancel its bookings (`cancelledBy: "system"`, reason `"payment failed"`). The cart stays untouched, so the customer can retry.
- **Expiry sweep:** run a cron job every minute or two. Find Orders with `paymentStatus: "created"` and `expiresAt < now`. Mark them `failed` and cancel their pending bookings (`cancelledBy: "system"`, reason `"payment timeout"`). This releases the slots.

Retry means creating a new Order, since the old one is `failed`.

### 4.10 Doing the job

| Moment | Who | Write |
|---|---|---|
| Provider arrives and starts | Provider | `Booking.status: "in_progress"` |
| Work finished | Provider | `Booking.status: "completed"` |

Only the assigned provider can move their own booking. Managers and admin can override.

### 4.11 Payout

Run when a booking is `completed` and `Order.paymentStatus` is `paid` (or partially refunded, as long as this booking wasn't refunded) and `payoutStatus: "pending"`.

1. Transfer `providerShare` to the provider's `razorpayAccountId` (for example through Razorpay Route).
2. On success: `payoutStatus: "paid"`, `payoutAt: now`.
3. Never pay a booking twice. Update with a filter that includes `payoutStatus: "pending"` so the update is atomic.

Consider a short hold, such as 24 hours after completion, to allow for disputes. Skip payout for cancelled or refunded bookings.

### 4.12 Reviews

Allowed only when the booking is `completed`, the reviewer is the booking's customer, and no review exists (the unique index enforces this).

1. Insert **Review** with `booking`, `provider`, `service`, `rating`, `review`.
2. Update running averages atomically:
   - `Provider.rating = (rating × ratingCount + new) / (ratingCount + 1)`, then `ratingCount += 1`.
   - `Service.rating` and `Service.reviewCount` the same way.
3. If reviews can be edited or deleted, adjust the averages by the difference, or recompute with an aggregation.

### 4.13 Cancellation and refunds

1. **Check who cancels and when.**
   - A customer may cancel while the booking is `pending` or `confirmed`.
   - A provider may cancel a `confirmed` booking.
   - Managers and admin may cancel at any time before `completed`.
   - Nobody can cancel a `completed` booking.
2. **Update the booking:** `status: "cancelled"`, `cancelledBy`, `cancelledReason`.
3. **If the booking was paid,** decide the refund amount from your policy (full, partial, or none). Then:
   - Call the Razorpay refund API with the `razorpayPaymentId` and the amount.
   - Append `{booking, amount, razorpayRefundId, status: "initiated", createdAt}` to `Payment.refunds`.
   - Update that entry to `processed` or `failed` when the refund webhook arrives.
4. **Update `Order.paymentStatus`:**
   - Every booking refunded in full: `refunded`.
   - Some refunded: `partially_refunded`.
5. **Provider cancels:** either give the customer a full refund, or **reassign** a new provider (run §4.6 and update `Booking.provider`, with the same lock step as in checkout).
6. **Payout:** set nothing for cancelled bookings. They are skipped by payout.

The sum of `refunds[].amount` must never exceed `Payment.totalAmount`, and a booking's refunds must not exceed its `price`. Check this before calling Razorpay.

### 4.14 Provider unavailability

- Provider adds a block: insert **Unavailability** (`recurringMode`, and `recurrenceEndDate` if recurring).
- Blocks only affect **new** assignments. Existing bookings inside the new block are not removed automatically. Warn the provider, and let them cancel or ask a manager to reassign.

### 4.15 Manager's day

| Task | Query |
|---|---|
| Pending providers | `Provider` where `region ∈ myRegions`, `status: pending` |
| Today's jobs | `Booking` where `region ∈ myRegions`, `scheduledDate: today` |
| Problem bookings | `Booking` where `region ∈ myRegions` and cancelled by provider or system |
| Suspend a provider | Set `status: suspended`, recompute centroid, reassign their future confirmed bookings |

### 4.16 Admin's day

- Edit `PlatformSetting`, catalogue, regions and managers.
- Block users (`User.status: blocked`).
- Override any booking status, refund, or payout when needed.

---

## 5. State machines

**Order.paymentStatus**

```
created ──► paid ──► partially_refunded ──► refunded
   │          └──────────────────────────────► refunded
   └──► failed
```

**Booking.status**

```
pending ──► confirmed ──► in_progress ──► completed
   │            │              │
   └────────────┴──────────────┴──► cancelled   (in_progress: manager or admin only)
```

| Transition | Triggered by |
|---|---|
| `pending → confirmed` | Payment success |
| `pending → cancelled` | Payment failure or expiry (`system`), or the customer |
| `confirmed → in_progress` | Provider |
| `in_progress → completed` | Provider (manager or admin can override) |
| `confirmed → cancelled` | Customer, provider, manager or admin |

**Slot-holding statuses** (count towards conflicts): `pending`, `confirmed`, `in_progress`.

---

## 6. Permissions summary

| Action | Customer | Provider | Manager | Admin |
|---|:--:|:--:|:--:|:--:|
| Edit own profile, addresses, cart | ✅ | ✅ | ✅ | ✅ |
| Create order, pay | ✅ | | | |
| Cancel a booking | own | own | own regions | all |
| Start or complete a job | | own | override | override |
| Add review | own completed | | | |
| Set unavailability | | own | | |
| Approve or suspend providers | | | own regions | all |
| View bookings | own | own | own regions | all |
| Manage catalogue, regions, managers, settings | | | | ✅ |
| Trigger refunds or payouts manually | | | limited | ✅ |

Always filter on the server by the authenticated user (customer id, provider id, or manager's regions). Never trust ids sent by the client.

---

## 7. Indexes

| Collection | Index | Purpose |
|---|---|---|
| User | `email` unique, `phone` unique | Login |
| User | `addresses.location` 2dsphere | Address-based lookups (optional) |
| Provider | `user` unique | One profile per user |
| Provider | `location` 2dsphere | Job assignment |
| Provider | `{status, offeredServices}` | Candidate filtering |
| Provider | `{region, status}` | Manager screens |
| Manager | `user` unique, `location` 2dsphere | |
| Region | `location` 2dsphere, `manager` | Nearest-region lookup |
| Category | `name` unique | |
| Service | `{category, isActive}` | Browsing |
| Unavailability | `{provider, startDateTime}` | Availability checks |
| Order | `{customer, createdAt}` | Order history |
| Order | `{paymentStatus, expiresAt}` | Expiry sweep |
| Booking | `{provider, scheduledDate, startTime}` **partial unique** where `status ∈ [pending, confirmed, in_progress]` | Blocks identical-start double bookings |
| Booking | `{provider, scheduledDate, status}` | Overlap checks and provider calendar |
| Booking | `{customer, createdAt}` | Customer history |
| Booking | `{region, scheduledDate, status}` | Manager screens |
| Booking | `{order}` | Order → bookings |
| Booking | `{payoutStatus, status}` | Payout job |
| Payment | `order` unique, `razorpayOrderId` unique | Webhook lookup |
| Payment | `razorpayPaymentId` unique sparse | Idempotency |
| Review | `booking` unique, `{service, createdAt}`, `{provider, createdAt}` | One review per booking |

---

## 8. Things to note

**Consistency and safety**
- Wrap checkout, payment success, and cancellation in **transactions**. Several documents change together.
- Make webhook handlers **idempotent**. Razorpay can deliver the same event more than once, and the client verification call may race the webhook.
- Never take prices or amounts from the client. Recompute from Service and compare with the Razorpay amount.
- Keep Razorpay key secrets and webhook secrets on the server only.
- Never return `password` in API responses.

**Data integrity**
- Snapshots (`Booking.price`, `platformFeePercent`, `Order.address`) must never be updated after creation. Editing a Service price or an address only affects future orders.
- The app must keep `Order.totalAmount` equal to the sum of its bookings' `price`, and `providerShare + platformShare` equal to `price`.
- When a provider's `status` or `location` changes, recompute the region centroid.
- Only `approved` providers who have a `razorpayAccountId` can be paid out, so check this before the payout job.

**Operations**
- Run the **order-expiry job** continuously. If it stops, unpaid orders will hold slots indefinitely.
- Run the **payout job** on a schedule (daily is typical).
- Log failed refunds and failed payouts, and retry them. Don't lose them.
- Back up the database, and test restores.

**Known simplifications (add later if needed)**
- There is no audit log, support ticket, notification history, per-region pricing, or payout batches. All can be added as new collections without changing the existing ones.
- Manager salary is stored but not processed by this system.
- A user holds one role. Becoming both a customer and a provider needs a second account, or a change to a `roles` array.
- No-show handling and rescheduling are not modelled. Reschedule can be done as cancel and rebook, and a `no_show` status can be added to `Booking.status` when needed.
- The provider's job screen needs the address from Order. If that lookup becomes a bottleneck, copy the address snapshot onto Booking.
