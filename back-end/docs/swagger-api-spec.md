# Tatku United API & Swagger Documentation

Complete RESTful API Specification and OpenAPI / Swagger 3.0 Reference for the **Tatku United** On-Demand Digital & Home Services Marketplace Platform.

---

## 1. Quick Access & Interactive URLs

The interactive Swagger UI and raw OpenAPI specifications are served directly by the NestJS application:

| Resource | URL | Description |
| :--- | :--- | :--- |
| **Interactive Swagger UI (Primary)** | [`http://localhost:3000/docs`](http://localhost:3000/docs) | Full interactive documentation with live "Try it out" console |
| **Interactive Swagger UI (Alias)** | [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs) | Alternative documentation path |
| **OpenAPI 3.0 Specification (JSON)** | [`http://localhost:3000/docs-json`](http://localhost:3000/docs-json) | Raw OpenAPI v3.0 JSON specification stream |
| **OpenAPI 3.0 Specification (YAML)** | [`http://localhost:3000/docs-yaml`](http://localhost:3000/docs-yaml) | Raw OpenAPI v3.0 YAML specification stream |
| **Local Exported Spec File** | [`back-end/docs/swagger.json`](./swagger.json) | Offline JSON file for SDK and frontend type generators |

---

## 2. API Architecture & Global Parameters

- **Base URL**: `http://localhost:3000`
- **Default Port**: `3000` (configurable via `PORT` in `.env`)
- **Protocol**: HTTP/1.1 (JSON `Content-Type: application/json`)
- **Security Scheme**: `bearer-token` (`Authorization: Bearer <JWT_TOKEN>`)
- **Correlation ID Header**: `X-Request-Id` (propagated in request & response headers for tracing)

---

## 3. Complete URL Index (61 Endpoints)

### 3.1. System & Health Check (1 URL)
| Method | Path | Summary | Description | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | System health check & greeting | Verifies backend is running | `200` |

---

### 3.2. Users (`/users`) (5 URLs)
Manages customer, provider, manager, and administrator account profiles and authentication identities.

| Method | Path | Summary | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/users` | Create user | Body: `CreateUserDto` (`name`, `email`, `password`, `phone`, `role`, `gender?`, `dob?`) | `201`, `400` |
| `GET` | `/users` | Get all users | None | `200` |
| `GET` | `/users/:id` | Get user by ID | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/users/:id` | Update user | Param: `id`, Body: `UpdateUserDto` | `200`, `404` |
| `DELETE` | `/users/:id` | Delete user | Param: `id` | `200`, `404` |

---

### 3.3. Service Providers (`/providers`) (5 URLs)
Manages service provider profiles, assigned services, work shifts, active days, and GeoJSON location coordinates.

| Method | Path | Summary | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/providers` | Create provider profile | Body: `CreateProviderDto` (`user`, `offeredServices[]`, `experience`, `workHourStart`, `workHourEnd`, `workingDays[]`, `location`) | `201`, `400` |
| `GET` | `/providers` | Get all providers | None | `200` |
| `GET` | `/providers/:id` | Get provider by ID | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/providers/:id` | Update provider | Param: `id`, Body: `UpdateProviderDto` | `200`, `404` |
| `DELETE` | `/providers/:id` | Delete provider | Param: `id` | `200`, `404` |

---

### 3.4. Regional Managers (`/managers`) (5 URLs)
Manages authorized individuals representing provider collectives in specific geographic zones.

| Method | Path | Summary | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/managers` | Create manager profile | Body: `CreateManagerDto` (`user`, `salary`, `experience`, `location`) | `201`, `400` |
| `GET` | `/managers` | Get all managers | None | `200` |
| `GET` | `/managers/:id` | Get manager by ID | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/managers/:id` | Update manager | Param: `id`, Body: `UpdateManagerDto` | `200`, `404` |
| `DELETE` | `/managers/:id` | Delete manager | Param: `id` | `200`, `404` |

---

### 3.5. Service Regions (`/regions`) (5 URLs)
Operational areas and geographical boundaries overseen by managers, containing centroid coordinates.

| Method | Path | Summary | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/regions` | Create region | Body: `CreateRegionDto` (`name`, `manager`, `location`, `isActive?`) | `201`, `400` |
| `GET` | `/regions` | Get all regions | None | `200` |
| `GET` | `/regions/:id` | Get region by ID | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/regions/:id` | Update region | Param: `id`, Body: `UpdateRegionDto` | `200`, `404` |
| `DELETE` | `/regions/:id` | Delete region | Param: `id` | `200`, `404` |

---

### 3.6. Service Categories (`/categories`) (5 URLs)
High-level taxonomical groupings of services (e.g., Cleaning, Electrical, Plumbing, Appliance Repair).

| Method | Path | Summary | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/categories` | Create category | Body: `CreateCategoryDto` (`name`, `description`, `imageUrl`, `isActive?`) | `201`, `400` |
| `GET` | `/categories` | Get all categories | None | `200` |
| `GET` | `/categories/:id` | Get category by ID | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/categories/:id` | Update category | Param: `id`, Body: `UpdateCategoryDto` | `200`, `404` |
| `DELETE` | `/categories/:id` | Delete category | Param: `id` | `200`, `404` |

---

### 3.7. Services Catalog (`/services`) (5 URLs)
Individual bookable services including duration, pricing in paise, coverage bullet points, and FAQs.

| Method | Path | Summary | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/services` | Create service offering | Body: `CreateServiceDto` (`name`, `category`, `description`, `price`, `duration`, `imageUrls?`, `whatIsCovered?`, `whatIsNotCovered?`, `howItWorks?`, `faq?`, `isActive?`) | `201`, `400` |
| `GET` | `/services` | Get all services | None | `200` |
| `GET` | `/services/:id` | Get service by ID | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/services/:id` | Update service | Param: `id`, Body: `UpdateServiceDto` | `200`, `404` |
| `DELETE` | `/services/:id` | Delete service | Param: `id` | `200`, `404` |

---

### 3.8. Orders (`/orders`) (5 URLs)
Customer checkout batches snapshotting immutable delivery address, total paise, and 15-minute expiration timers.

| Method | Path | Summary | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/orders` | Create order | Body: `CreateOrderDto` (`customer`, `address`, `totalAmount`, `expiresAt`) | `201`, `400` |
| `GET` | `/orders` | Get all orders | None | `200` |
| `GET` | `/orders/:id` | Get order by ID | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/orders/:id` | Update order | Param: `id`, Body: `UpdateOrderDto` | `200`, `404` |
| `DELETE` | `/orders/:id` | Delete order | Param: `id` | `200`, `404` |

---

### 3.9. Bookings (`/bookings`) (5 URLs)
Discrete service appointments on the 30-minute slot grid, provider travel buffer, and fee splits.

| Method | Path | Summary | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/bookings` | Create booking | Body: `CreateBookingDto` (`service`, `provider`, `customer`, `order`, `region`, `scheduledDate`, `startTime`, `endTime`, `blockStartTime`, `price`, `platformFeePercent`, `platformShare`, `providerShare`) | `201`, `400` |
| `GET` | `/bookings` | Get all bookings | None | `200` |
| `GET` | `/bookings/:id` | Get booking by ID | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/bookings/:id` | Update booking | Param: `id`, Body: `UpdateBookingDto` | `200`, `404` |
| `DELETE` | `/bookings/:id` | Delete booking | Param: `id` | `200`, `404` |

---

### 3.10. Payments (`/payments`) (5 URLs)
Razorpay order transactions, payment IDs, capture verifications, and automated refunds.

| Method | Path | Summary | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/payments` | Initialize payment | Body: `CreatePaymentDto` (`order`, `totalAmount`, `currency?`, `razorpayOrderId`) | `201`, `400` |
| `GET` | `/payments` | Get all payments | None | `200` |
| `GET` | `/payments/:id` | Get payment by ID | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/payments/:id` | Update payment | Param: `id`, Body: `UpdatePaymentDto` | `200`, `404` |
| `DELETE` | `/payments/:id` | Delete payment | Param: `id` | `200`, `404` |

---

### 3.11. Reviews (`/reviews`) (5 URLs)
Verified customer feedback and 1-5 star ratings for completed bookings.

| Method | Path | Summary | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/reviews` | Submit review | Body: `CreateReviewDto` (`booking`, `rating`, `review?`, `provider`, `service`) | `201`, `400` |
| `GET` | `/reviews` | Get all reviews | None | `200` |
| `GET` | `/reviews/:id` | Get review by ID | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/reviews/:id` | Update review | Param: `id`, Body: `UpdateReviewDto` | `200`, `404` |
| `DELETE` | `/reviews/:id` | Delete review | Param: `id` | `200`, `404` |

---

### 3.12. Provider Unavailability (`/unavailability`) (5 URLs)
Calendar blackout periods preventing auto-assignment and customer bookings during time-off.

| Method | Path | Summary | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/unavailability` | Create unavailability | Body: `CreateUnavailabilityDto` (`provider`, `date`, `startTime`, `endTime`, `reason?`) | `201`, `400` |
| `GET` | `/unavailability` | Get all unavailabilities | None | `200` |
| `GET` | `/unavailability/:id` | Get unavailability by ID | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/unavailability/:id` | Update unavailability | Param: `id`, Body: `UpdateUnavailabilityDto` | `200`, `404` |
| `DELETE` | `/unavailability/:id` | Delete unavailability | Param: `id` | `200`, `404` |

---

### 3.13. Platform Settings (`/platform-settings`) (5 URLs)
Global parameters governing commissions, dispatch radius, slot increments, lead times, and dispatch timeouts.

| Method | Path | Summary | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/platform-settings` | Create settings | Body: `CreatePlatformSettingDto` (`platformFeePercent`, `maxAssignmentDistanceKm`, `slotIntervalMinutes`, `firstSlotStart`, `lastSlotStart`, `bookingWindowDays`, `minLeadMinutes`, `travelBufferMinutes`, `offerTimeoutMinutes`) | `201`, `400` |
| `GET` | `/platform-settings` | Get all settings | None | `200` |
| `GET` | `/platform-settings/:id` | Get setting by ID | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/platform-settings/:id` | Update setting | Param: `id`, Body: `UpdatePlatformSettingDto` | `200`, `404` |
| `DELETE` | `/platform-settings/:id` | Delete setting | Param: `id` | `200`, `404` |

---

## 4. Key Data Formats & Conventions

1. **Currency**: All amounts (such as `price`, `totalAmount`, `salary`, `platformShare`, `providerShare`) are stored and transmitted as integers in **paise** (1 INR = 100 paise; e.g. ₹499 = `49900`).
2. **Time and Slots**:
   - `scheduledDate`: ISO 8601 UTC date string marking midnight of the IST calendar day (e.g. `2026-10-15T00:00:00.000Z`).
   - `startTime` / `endTime` / `blockStartTime`: Integers representing **minutes from midnight** (e.g., `480` = 08:00 AM, `570` = 09:30 AM, `1200` = 08:00 PM).
3. **Geographic Coordinates**:
   - Standard GeoJSON `Point`: `{ "type": "Point", "coordinates": [longitude, latitude] }`.
4. **Validation & Errors**:
   - Strict `ValidationPipe` with `{ whitelist: true, forbidNonWhitelisted: true }` rejects undeclared fields with `400 Bad Request`.
   - Global `AllExceptionsFilter` normalizes error responses into a consistent JSON payload with correlation `requestId` and timestamp.
