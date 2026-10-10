# Home Services Platform: Database Usage Guide

A practical guide to what each collection holds, who writes to it, and exactly what data to enter at each step of every process. Written for MongoDB (use a replica set or Atlas, because transactions are required).

---

## 1. Actors

| Actor            | `User.role` | Extra document | What they do                                                  |
| ---------------- | ----------- | -------------- | ------------------------------------------------------------- |
| Customer         | `customer`  | none           | Browse, fill cart, pay, review, cancel                        |
| Service Provider | `provider`  | `Provider`     | Accepts or rejects job offers, performs jobs, blocks off time |
| Regional Manager | `manager`   | `Manager`      | Approves providers, monitors bookings in their regions        |
| Super User       | `admin`     | none           | Configures the platform, creates catalogue, regions, managers |

Every person has exactly one `User` document. Provider and Manager are **profile documents** that point back to a User through `user`.

---

## 2. Global conventions

| Topic                 | Rule                                                                                                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IDs                   | MongoDB `_id` (ObjectId). `id string pk` in the diagram means `_id`.                                                                                                                                                          |
| Timestamps            | Enable `timestamps: true` on every schema. This gives `createdAt` and `updatedAt` automatically.                                                                                                                              |
| Money                 | Integers in **paise** (₹499 is `49900`). Never use floats. Currency is `"INR"`.                                                                                                                                               |
| Percentages           | Whole numbers or decimals such as `20` for 20%. Compute shares with `Math.round`.                                                                                                                                             |
| Geo                   | Store `{ type: "Point", coordinates: [longitude, latitude] }`. **Longitude first.** Distances in `$nearSphere`/`$geoNear` are in **metres**. `maxAssignmentDistanceKm` must be multiplied by 1000.                            |
| Time zone             | The platform runs in one zone, `Asia/Kolkata`. Store instants (`expiresAt`, `offerExpiresAt`) in UTC.                                                                                                                         |
| Slot date and time    | `scheduledDate` (and `Unavailability.date`) is a date (midnight of the IST calendar day). `startTime` and `endTime` are **minutes from midnight** (9:30 AM is `570`). Use the same unit as `workHourStart` and `workHourEnd`. |
| Slot grid             | Start times are multiples of `slotIntervalMinutes` (30) from `firstSlotStart` (8:00) to `lastSlotStart` (19:30). A service may end after 19:30; only the start is restricted.                                                 |
| Travel buffer         | Every booking blocks the provider from `startTime − travelBufferMinutes` to `endTime`. The blocked start is stored as `Booking.blockStartTime`.                                                                               |
| Booking window        | Customers can book today and the next `bookingWindowDays − 1` days (3 days in total with the default of 3).                                                                                                                   |
| Weekdays              | `workingDays` uses `0 = Sunday … 6 = Saturday`.                                                                                                                                                                               |
| Passwords             | Store only a hash (bcrypt or argon2).                                                                                                                                                                                         |
| Snapshots             | Copy values onto Booking and Order at creation (price, fee percent, address, blocked start). Never recompute history from current Service or Setting values.                                                                  |
| Referential integrity | MongoDB does not enforce `ref`. Your application must validate that referenced documents exist.                                                                                                                               |
| Deletion              | Don't delete business data. Use `status` or `isActive` flags. (Old `Unavailability` rows are the exception; they are safe to purge.)                                                                                          |

### Enum reference

| Field                      | Values                                                                     |
| -------------------------- | -------------------------------------------------------------------------- |
| `User.gender`              | `male, female, other`                                                      |
| `User.role`                | `customer, provider, manager, admin`                                       |
| `User.status`              | `active, blocked`                                                          |
| `Provider.status`          | `pending, approved, suspended`                                             |
| `Manager.status`           | `active, suspended, inactive`                                              |
| `Order.paymentStatus`      | `created, paid, failed, refunded, partially_refunded`                      |
| `Booking.status`           | `pending, awaiting_provider, confirmed, in_progress, completed, cancelled` |
| `Booking.cancelledBy`      | `customer, provider, manager, admin, system`                               |
| `Booking.payoutStatus`     | `pending, paid`                                                            |
| `Payment.refunds[].status` | `initiated, processed, failed`                                             |

---

## 3. Collections reference

### 3.1 PlatformSetting (single document)

Created once by the admin before anything else.

| Field                             | Notes                                                                                                                |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `platformFeePercent`              | Platform commission. The provider's share is `100 − platformFeePercent`, so there is no separate provider-fee field. |
| `maxAssignmentDistanceKm`         | Maximum distance between a job address and a provider.                                                               |
| `slotIntervalMinutes`             | Slot step. `30`.                                                                                                     |
| `firstSlotStart`, `lastSlotStart` | First and last allowed start time, in minutes. `480` (8:00) and `1170` (19:30).                                      |
| `bookingWindowDays`               | How far ahead customers can book. `3` means today plus the next 2 days.                                              |
| `minLeadMinutes`                  | How soon from now a slot can start, for today's bookings. For example `120`.                                         |
| `travelBufferMinutes`             | Travel time blocked before each job. `30`.                                                                           |
| `offerTimeoutMinutes`             | How long a provider has to accept or reject an offer. For example `10`.                                              |

Read it on every checkout and slot listing. Changing it only affects **future** bookings.

### 3.2 User

| Field            | Notes                                                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `email`, `phone` | Unique indexes. Required for login and OTP.                                                                                              |
| `role`, `status` | Check both on every authenticated request. `blocked` users cannot log in or book.                                                        |
| `addresses[]`    | Each entry needs a self-generated `id` (use an ObjectId string). `location` is GeoJSON.                                                  |
| `cart`           | Embedded. `cart.address` holds the `id` of one entry in `addresses`. `cart.items[]` hold `{service, scheduledDate, startTime, endTime}`. |

The cart lives on the user: it is small, private, and always read with the user. It stores **no prices**; prices are read from Service at checkout.

### 3.3 Provider

| Field                              | Notes                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `user`                             | Unique. The User must have `role: provider`.                                                |
| `offeredServices[]`                | Services this provider can perform (multikey index).                                        |
| `workHourStart/End`, `workingDays` | Weekly availability window.                                                                 |
| `location`                         | Home or base point. This drives `$near` job assignment.                                     |
| `status`                           | Only `approved` providers can receive jobs.                                                 |
| `rating`, `ratingCount`            | Running average, updated when a review is added (see §4.13).                                |
| `region`                           | Management grouping only. It plays no part in assignment.                                   |
| `razorpayAccountId`                | The linked account used for payouts. Required before the first payout, not before approval. |

### 3.4 Manager

| Field    | Notes                                                                |
| -------- | -------------------------------------------------------------------- |
| `user`   | Unique. The User must have `role: manager`.                          |
| `salary` | Paise. Informational only, because salary payments are not modelled. |
| `status` | `active` managers can act on their regions.                          |

One manager can own several regions (`Region.manager` points at the manager).

### 3.5 Region

A region is a management label, **not** a physical boundary.

| Field      | Notes                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------- |
| `manager`  | The manager responsible.                                                                        |
| `location` | Centroid (see §4.2). The admin sets it at creation. After that it is recomputed from providers. |
| `isActive` | Inactive regions are skipped when matching addresses.                                           |

### 3.6 Category and Service

Admin-managed catalogue. Customers only see `isActive: true` records.

| Field                           | Notes                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `Service.price`                 | Paise. The current list price, copied to `Booking.price` at checkout.                                                  |
| `Service.duration`              | Minutes. `endTime = startTime + duration`.                                                                             |
| `Service.rating`, `reviewCount` | Stored counters, updated when reviews are added.                                                                       |
| Embedded arrays                 | `howItWorks`, `faq`, `whatIsCovered`, `whatIsNotCovered`, `imageUrls`. These are static content, edited only by admin. |

To retire a service, set `isActive: false`. Existing bookings are unaffected.

### 3.7 Unavailability

Provider time off, set in whole slots on a single day, for example "8:00 to 10:00 on 12 Oct".

| Field                  | Notes                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `provider`             | Whose time off it is.                                                                             |
| `date`                 | The IST calendar day.                                                                             |
| `startTime`, `endTime` | Minutes from midnight, both on the slot grid. `startTime < endTime`. For example `480` and `600`. |
| `reason`               | Optional text.                                                                                    |

There is no recurrence. Customers can only book a few days ahead, so a provider adds blocks for the days that matter. A fixed weekly day off belongs in `workingDays`. A full day off is one row covering the whole working day.

Blocks only affect **new** assignments (§4.6). Rows for past dates can be purged.

### 3.8 Order

The customer's checkout. It is created **before** payment and holds slots until it expires.

| Field           | Notes                                                                              |
| --------------- | ---------------------------------------------------------------------------------- |
| `customer`      | The buyer.                                                                         |
| `address`       | Snapshot `{line, city, location}` copied from the chosen address.                  |
| `totalAmount`   | The sum of all its bookings' `price`, in paise.                                    |
| `payment`       | Ref to Payment. Briefly `null` between order creation and Razorpay order creation. |
| `paymentStatus` | The only place where payment state lives.                                          |
| `expiresAt`     | Order creation time plus 15 minutes (configurable).                                |

### 3.9 Booking

One row per service per slot. An order with 3 services creates 3 bookings, possibly with 3 different providers.

| Field                                                | Notes                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `order`, `customer`, `service`, `provider`, `region` | All set at order creation. The provider is auto-assigned and is **tentative** until they accept.                       |
| `scheduledDate`, `startTime`, `endTime`              | The slot.                                                                                                              |
| `blockStartTime`                                     | `startTime − travelBufferMinutes`. A snapshot. The provider is blocked from here to `endTime`.                         |
| `price`                                              | Snapshot of `Service.price`.                                                                                           |
| `platformFeePercent`                                 | Snapshot of the setting.                                                                                               |
| `platformShare`, `providerShare`                     | `platformShare = round(price × fee / 100)`, `providerShare = price − platformShare`.                                   |
| `offerExpiresAt`                                     | Only set while `status` is `awaiting_provider`. When the current provider's offer lapses. Cleared on accept or cancel. |
| `declinedBy[]`                                       | Providers who rejected, timed out, or cancelled after accepting. They are never offered this booking again.            |
| `payoutStatus`, `payoutAt`                           | Provider settlement.                                                                                                   |
| `status`, `cancelledBy`, `cancelledReason`           | Lifecycle. See §5.                                                                                                     |

The job address is **not** on the Booking. Read it from `Booking.order → Order.address`. Use `$lookup` or populate in the provider's job view.

### 3.10 Payment

Gateway data only. One Payment per Order.

| Field                                    | Notes                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| `order`                                  | Unique index.                                                                          |
| `totalAmount`, `currency`                | Must equal the Order's total and `"INR"`.                                              |
| `razorpayOrderId`                        | Unique index. This is how the webhook finds the Payment.                               |
| `razorpayPaymentId`, `razorpaySignature` | Filled on successful payment.                                                          |
| `refunds[]`                              | `{booking, amount, razorpayRefundId, status, createdAt}`. Append one entry per refund. |

### 3.11 Review

| Field                 | Notes                                                          |
| --------------------- | -------------------------------------------------------------- |
| `booking`             | Unique index (one review per booking).                         |
| `provider`, `service` | Copied from the booking so ratings can be aggregated directly. |
| `rating`, `review`    | Rating 1–5, text optional.                                     |

---

## 4. Process walkthroughs (what to write, and when)

### 4.1 Platform setup (Admin, once)

1. Insert the single **PlatformSetting** document with all its fields (fee, distance, slot grid, booking window, lead time, travel buffer, offer timeout).
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

- **Add item:** validate the slot (§4.6, "Slot validation"), then push `{service, scheduledDate, startTime, endTime}`, where `endTime = startTime + service.duration`.
- **Select address:** set `cart.address` to an `addresses[].id`.
- **Remove item:** pull it by index or by value.
- Carts do **not** reserve slots. A cart item can become unavailable, which is why checkout re-checks everything.

### 4.6 Slots and provider availability

**Slot validation.** Run this when adding to the cart and again at checkout. A slot is valid when:

1. `scheduledDate` is between today and today + `bookingWindowDays − 1` (IST).
2. `startTime` is a multiple of `slotIntervalMinutes` and lies between `firstSlotStart` and `lastSlotStart`.
3. For today, `startTime ≥ (current IST minutes) + minLeadMinutes`.

Then compute `endTime = startTime + duration` and `blockStartTime = startTime − travelBufferMinutes`.

**Provider qualification.** Run this per cart item, both when showing slots and when checking out. A provider qualifies when **all** of these hold:

1. `status: "approved"`.
2. `offeredServices` contains the service.
3. Within `maxAssignmentDistanceKm × 1000` metres of the order address (`$nearSphere` or `$geoNear`, nearest first).
4. `workingDays` contains the weekday of `scheduledDate`.
5. The service itself fits in work hours: `workHourStart ≤ startTime` and `endTime ≤ workHourEnd`. The travel buffer is not counted here.
6. No overlapping **active** booking. Same date, `status ∈ [pending, awaiting_provider, confirmed, in_progress]`, and:
   `existing.blockStartTime < new.endTime` **and** `existing.endTime > new.blockStartTime`.
7. No overlapping **unavailability**. Same date, and:
   `unavailability.startTime < new.endTime` **and** `unavailability.endTime > new.blockStartTime`.
8. When reassigning: the provider is not in the booking's `declinedBy`.

Pick the first (nearest) qualifying provider. You can break ties with a higher `rating`.

**Worked examples.** A 10:00 booking of 1 hour has `startTime 600`, `endTime 660`, `blockStartTime 570`, so the provider is blocked 9:30 to 11:00.

- A new booking at 11:00 (block starts 10:30) conflicts. At 11:30 (block starts 11:00) it does not.
- With an unavailability of 8:00 to 10:00 (`480` to `600`), a booking at 10:00 conflicts because the provider would have to leave at 9:30. A booking at 10:30 is fine.

**Showing slots to the customer.** For a service, address and date:

1. Fetch the candidate providers once (rules 1 to 4, nearest first).
2. Fetch those providers' active bookings and unavailability for that date, in one query each.
3. Loop through the slot grid in memory (24 slots with the defaults) and mark a slot available if at least one candidate passes rules 5 to 7.

### 4.7 Checkout: creating the Order (the critical step)

Pre-checks: the cart is not empty, `cart.address` exists in `addresses`, every service is `isActive`, and every slot passes slot validation (§4.6).

**Step A: one transaction**

For each cart item:

1. Find a provider (§4.6). If none is found for any item, abort the whole checkout and tell the customer which slot failed.
2. **Lock the provider:** inside the transaction, update that Provider with `$currentDate: { updatedAt: true }` before inserting the booking. This forces two concurrent checkouts for the same provider to conflict, so one retries. Without it, two transactions can both pass the overlap check and insert overlapping bookings (write skew). The partial unique index only catches identical start times.
3. Find the nearest active region to the address: `Booking.region`.
4. Insert the **Booking**:
   - `status: "pending"`, `price` from Service, `platformFeePercent` from PlatformSetting
   - `platformShare` and `providerShare` calculated
   - `blockStartTime`, `declinedBy: []`
   - `payoutStatus: "pending"`
   - `order`, `customer`, `service`, `provider`, `region`, and the slot

Then insert the **Order**: `customer`, address snapshot, `totalAmount` (sum of prices), `paymentStatus: "created"`, `expiresAt: now + 15 min`.

Commit.

The chosen provider is only **holding** the slot at this point. They are not notified yet.

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
   - All the order's bookings: `status: "awaiting_provider"` and `offerExpiresAt: now + offerTimeoutMinutes`.
   - Customer: clear `cart.items` and `cart.address`.
5. Notify the customer ("finding your professional") and each assigned provider (new job offer).

Bookings become `confirmed` only when the provider accepts (§4.10).

**Late payment:** if the payment arrives after the order expired (bookings already cancelled), do not move them on. Refund it in full and record the refund on Payment.

### 4.9 Payment failure or expiry

- **Failure event:** set `Order.paymentStatus: "failed"` and cancel its bookings (`cancelledBy: "system"`, reason `"payment failed"`). The cart stays untouched, so the customer can retry.
- **Expiry sweep:** run a cron job every minute or two. Find Orders with `paymentStatus: "created"` and `expiresAt < now`. Mark them `failed` and cancel their `pending` bookings (`cancelledBy: "system"`, reason `"payment timeout"`). This releases the slots.

Retry means creating a new Order, since the old one is `failed`. No provider has been notified for unpaid orders, so there is nothing to withdraw.

### 4.10 Provider accepts or rejects

A provider's job inbox is the set of bookings where `provider` is them and `status: "awaiting_provider"`, with `offerExpiresAt` in the future.

**Accept.** One atomic update, no transaction needed:

- Filter: `{_id, provider: me, status: "awaiting_provider", offerExpiresAt: { $gt: now }}`.
- Set: `status: "confirmed"`, clear `offerExpiresAt`.
- If nothing matched, the offer already lapsed or was reassigned. Tell the provider.
- Notify the customer.

The slot was held since checkout, so no new overlap check is needed.

**Reject.** Use the same filter (without the time condition). Push the provider onto `declinedBy`, then run **reassignment**.

**Timeout.** The offer-expiry sweep runs every minute. Find bookings with `status: "awaiting_provider"` and `offerExpiresAt < now`. For each, push the provider onto `declinedBy` using a filter that includes the provider and the status (so a late accept cannot be undone), then run **reassignment**.

**Reassignment** (one transaction per booking):

1. Run §4.6 for the booking's slot, excluding everyone in `declinedBy`.
2. If a candidate is found: lock them (`$currentDate` on Provider), set `Booking.provider` to them, keep `status: "awaiting_provider"`, set `offerExpiresAt: now + offerTimeoutMinutes`, and notify them. The previous provider's slot is released automatically.
3. If none is found: set `status: "cancelled"`, `cancelledBy: "system"`, `cancelledReason: "no provider available"`, clear `offerExpiresAt`. Then refund that booking's `price` in full (§4.14, steps 3 and 4).

### 4.11 Doing the job

| Moment                      | Who      | Write                           |
| --------------------------- | -------- | ------------------------------- |
| Provider arrives and starts | Provider | `Booking.status: "in_progress"` |
| Work finished               | Provider | `Booking.status: "completed"`   |

Only the assigned provider can move their own booking, and only from `confirmed`. Managers and admin can override.

### 4.12 Payout

Run when a booking is `completed` and `Order.paymentStatus` is `paid` (or partially refunded, as long as this booking wasn't refunded) and `payoutStatus: "pending"`.

1. Transfer `providerShare` to the provider's `razorpayAccountId` (for example through Razorpay Route).
2. On success: `payoutStatus: "paid"`, `payoutAt: now`.
3. Never pay a booking twice. Update with a filter that includes `payoutStatus: "pending"` so the update is atomic.

Consider a short hold, such as 24 hours after completion, to allow for disputes. Skip payout for cancelled or refunded bookings.

### 4.13 Reviews

Allowed only when the booking is `completed`, the reviewer is the booking's customer, and no review exists (the unique index enforces this).

1. Insert **Review** with `booking`, `provider`, `service`, `rating`, `review`.
2. Update running averages atomically:
   - `Provider.rating = (rating × ratingCount + new) / (ratingCount + 1)`, then `ratingCount += 1`.
   - `Service.rating` and `Service.reviewCount` the same way.
3. If reviews can be edited or deleted, adjust the averages by the difference, or recompute with an aggregation.

### 4.14 Cancellation and refunds

1. **Check who cancels and when.**
   - A customer may cancel while the booking is `pending`, `awaiting_provider` or `confirmed`.
   - A provider may cancel a `confirmed` booking.
   - Managers and admin may cancel at any time before `completed`.
   - Nobody can cancel a `completed` booking.
2. **Update the booking:** `status: "cancelled"`, `cancelledBy`, `cancelledReason`, and clear `offerExpiresAt`.
3. **If the booking was paid,** decide the refund amount from your policy (full, partial, or none). A booking cancelled in `awaiting_provider` or by the system for lack of a provider is always a **full refund**. Then:
   - Call the Razorpay refund API with the `razorpayPaymentId` and the amount.
   - Append `{booking, amount, razorpayRefundId, status: "initiated", createdAt}` to `Payment.refunds`.
   - Update that entry to `processed` or `failed` when the refund webhook arrives.
4. **Update `Order.paymentStatus`:**
   - Every booking refunded in full: `refunded`.
   - Some refunded: `partially_refunded`.
5. **Provider cancels a confirmed booking:** do not cancel it. Push the provider onto `declinedBy`, set `status: "awaiting_provider"`, and run **reassignment** (§4.10). If nobody is found, it is cancelled by the system and refunded in full.
6. **Payout:** set nothing for cancelled bookings. They are skipped by payout.

The sum of `refunds[].amount` must never exceed `Payment.totalAmount`, and a booking's refunds must not exceed its `price`. Check this before calling Razorpay.

### 4.15 Provider unavailability

- Provider adds a block: insert **Unavailability** with `provider`, `date`, `startTime`, `endTime` (both on the slot grid) and an optional `reason`. Reject past dates and `startTime ≥ endTime`.
- Provider removes a block: delete the row.
- Blocks only affect **new** assignments. Existing bookings inside the new block are not removed automatically. Warn the provider, and let them cancel (which triggers reassignment) or ask a manager to reassign.

### 4.16 Manager's day

| Task               | Query                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pending providers  | `Provider` where `region ∈ myRegions`, `status: pending`                                                                                                               |
| Today's jobs       | `Booking` where `region ∈ myRegions`, `scheduledDate: today`                                                                                                           |
| Problem bookings   | `Booking` where `region ∈ myRegions` and cancelled by provider or system (including `"no provider available"`)                                                         |
| Suspend a provider | Set `status: suspended`, recompute centroid, reassign their future `confirmed` and `awaiting_provider` bookings (push them onto `declinedBy`, then §4.10 reassignment) |

### 4.17 Admin's day

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
pending ──► awaiting_provider ──► confirmed ──► in_progress ──► completed
   │               │ ▲               │  │           │
   │               │ │               │  └───────────┼─► (provider cancels: back to awaiting_provider)
   │               │ └───────────────┘              │
   └───────────────┴────────────────┴───────────────┴──► cancelled   (in_progress: manager or admin only)
```

| Transition                              | Triggered by                                                         |
| --------------------------------------- | -------------------------------------------------------------------- |
| `pending → awaiting_provider`           | Payment success                                                      |
| `pending → cancelled`                   | Payment failure or expiry (`system`), or the customer                |
| `awaiting_provider → awaiting_provider` | Provider rejects or times out, and another provider is found (§4.10) |
| `awaiting_provider → confirmed`         | Provider accepts                                                     |
| `awaiting_provider → cancelled`         | Customer, or `system` when no provider is left                       |
| `confirmed → in_progress`               | Provider                                                             |
| `in_progress → completed`               | Provider (manager or admin can override)                             |
| `confirmed → awaiting_provider`         | Provider cancels (§4.14, step 5)                                     |
| `confirmed → cancelled`                 | Customer, manager or admin                                           |

**Slot-holding statuses** (count towards conflicts): `pending`, `awaiting_provider`, `confirmed`, `in_progress`.

---

## 6. Permissions summary

| Action                                        |   Customer    | Provider |   Manager   |  Admin   |
| --------------------------------------------- | :-----------: | :------: | :---------: | :------: |
| Edit own profile, addresses, cart             |      ✅       |    ✅    |     ✅      |    ✅    |
| Create order, pay                             |      ✅       |          |             |          |
| Cancel a booking                              |      own      |   own    | own regions |   all    |
| Accept or reject a job offer                  |               |   own    |             |          |
| Start or complete a job                       |               |   own    |  override   | override |
| Add review                                    | own completed |          |             |          |
| Set unavailability                            |               |   own    |             |          |
| Approve or suspend providers                  |               |          | own regions |   all    |
| View bookings                                 |      own      |   own    | own regions |   all    |
| Manage catalogue, regions, managers, settings |               |          |             |    ✅    |
| Trigger refunds or payouts manually           |               |          |   limited   |    ✅    |

Always filter on the server by the authenticated user (customer id, provider id, or manager's regions). Never trust ids sent by the client.

---

## 7. Indexes

| Collection     | Index                                                                                                                           | Purpose                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| User           | `email` unique, `phone` unique                                                                                                  | Login                                           |
| User           | `addresses.location` 2dsphere                                                                                                   | Address-based lookups (optional)                |
| Provider       | `user` unique                                                                                                                   | One profile per user                            |
| Provider       | `location` 2dsphere                                                                                                             | Job assignment                                  |
| Provider       | `{status, offeredServices}`                                                                                                     | Candidate filtering                             |
| Provider       | `{region, status}`                                                                                                              | Manager screens                                 |
| Manager        | `user` unique, `location` 2dsphere                                                                                              |                                                 |
| Region         | `location` 2dsphere, `manager`                                                                                                  | Nearest-region lookup                           |
| Category       | `name` unique                                                                                                                   |                                                 |
| Service        | `{category, isActive}`                                                                                                          | Browsing                                        |
| Unavailability | `{provider, date}`                                                                                                              | Availability checks                             |
| Order          | `{customer, createdAt}`                                                                                                         | Order history                                   |
| Order          | `{paymentStatus, expiresAt}`                                                                                                    | Expiry sweep                                    |
| Booking        | `{provider, scheduledDate, startTime}` **partial unique** where `status ∈ [pending, awaiting_provider, confirmed, in_progress]` | Blocks identical-start double bookings          |
| Booking        | `{provider, scheduledDate, status}`                                                                                             | Overlap checks, provider calendar and job inbox |
| Booking        | `{status, offerExpiresAt}`                                                                                                      | Offer-expiry sweep                              |
| Booking        | `{customer, createdAt}`                                                                                                         | Customer history                                |
| Booking        | `{region, scheduledDate, status}`                                                                                               | Manager screens                                 |
| Booking        | `{order}`                                                                                                                       | Order → bookings                                |
| Booking        | `{payoutStatus, status}`                                                                                                        | Payout job                                      |
| Payment        | `order` unique, `razorpayOrderId` unique                                                                                        | Webhook lookup                                  |
| Payment        | `razorpayPaymentId` unique sparse                                                                                               | Idempotency                                     |
| Review         | `booking` unique, `{service, createdAt}`, `{provider, createdAt}`                                                               | One review per booking                          |

---

## 8. Things to note

**Consistency and safety**

- Wrap checkout, payment success, reassignment and cancellation in **transactions**. Several documents change together.
- Make webhook handlers **idempotent**. Razorpay can deliver the same event more than once, and the client verification call may race the webhook.
- Accept, reject and timeout all use **filtered atomic updates** (provider, status and expiry in the filter), so a late accept and the expiry sweep cannot both win.
- Never take prices or amounts from the client. Recompute from Service and compare with the Razorpay amount.
- Keep Razorpay key secrets and webhook secrets on the server only.
- Never return `password` in API responses.

**Data integrity**

- Snapshots (`Booking.price`, `platformFeePercent`, `blockStartTime`, `Order.address`) must never be updated after creation. Editing a Service price, an address or the travel buffer only affects future orders.
- The app must keep `Order.totalAmount` equal to the sum of its bookings' `price`, and `providerShare + platformShare` equal to `price`.
- When a provider's `status` or `location` changes, recompute the region centroid.
- Only `approved` providers who have a `razorpayAccountId` can be paid out, so check this before the payout job.

**Operations**

- Run the **order-expiry job** and the **offer-expiry job** continuously. If the first stops, unpaid orders hold slots indefinitely. If the second stops, paid bookings sit unanswered.
- Run the **payout job** on a schedule (daily is typical).
- Log failed refunds and failed payouts, and retry them. Don't lose them.
- Back up the database, and test restores.

**Known simplifications (add later if needed)**

- There is no audit log, support ticket, notification history, per-region pricing, or payout batches. All can be added as new collections without changing the existing ones.
- Offers are sequential (one provider at a time) and only the list of providers who declined is kept, so there is no per-offer history or acceptance-rate data. Add a `JobOffer` collection if you need that, or want to offer to several providers at once.
- Unavailability is one block on one day, with no recurrence.
- Manager salary is stored but not processed by this system.
- A user holds one role. Becoming both a customer and a provider needs a second account, or a change to a `roles` array.
- No-show handling and rescheduling are not modelled. Reschedule can be done as cancel and rebook, and a `no_show` status can be added to `Booking.status` when needed.
- The provider's job screen needs the address from Order. If that lookup becomes a bottleneck, copy the address snapshot onto Booking.
