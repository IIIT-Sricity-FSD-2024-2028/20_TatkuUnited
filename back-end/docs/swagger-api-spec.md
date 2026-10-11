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

## 2. API Architecture & Security Parameters

- **Base URL**: `http://localhost:3000`
- **Default Port**: `3000` (configurable via `PORT` in `.env`)
- **Protocol**: HTTP/1.1 (JSON `Content-Type: application/json`)
- **Security Scheme**: `bearer-token` (`Authorization: Bearer <JWT_TOKEN>`)
- **Header Convention**: Standard HTTP Bearer Token only. **No custom role headers (such as `x-role`) are required or used**; the user's role and identity are securely extracted from the signed JWT payload.
- **Correlation ID Header**: `X-Request-Id` (propagated in request & response headers for tracing)
- **Rate Limiting**: 100 requests per 60-second window enforced via `ThrottlerGuard`
- **Guards**: `JwtAuthGuard` (validates Bearer token & active account status) and `RolesGuard` (enforces role-based permissions) are registered as global `APP_GUARD` filters.

---

## 3. Complete URL Index (64 Endpoints)

### 3.1. System & Health Check (1 URL)
| Method | Path | Summary | Access / RBAC | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | System health check & greeting | `@Public()` | `200` |

---

### 3.2. Authentication (`/auth`) (3 URLs)
Handles customer and provider registration, credential verification, and JWT session token generation.

| Method | Path | Summary | Access / RBAC | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate user & issue JWT | `@Public()` | Body: `LoginDto` (`email`, `password`) | `200`, `400`, `401` |
| `POST` | `/auth/register` | Register new account & return JWT | `@Public()` | Body: `RegisterDto` (`name` / `fullName`, `email`, `password`, `phone`, `role?`, `gender?`, `dob?`) | `201`, `400` |
| `GET` | `/auth/profile` | Current authenticated session profile | `Bearer Token` | None | `200`, `401` |

---

### 3.3. Users (`/users`) (5 URLs)
Manages customer, provider, manager, and administrator account records.

| Method | Path | Summary | Access / RBAC | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/users` | Create user profile | `@Public()` | Body: `CreateUserDto` (`name`, `email`, `password`, `phone`, `role`, `gender?`, `dob?`) | `201`, `400` |
| `GET` | `/users` | Get all users | `@Roles(admin)` | None | `200`, `401`, `403` |
| `GET` | `/users/:id` | Get user by ID | `Bearer Token` | Param: `id` (Mongo ObjectId) | `200`, `401`, `404` |
| `PATCH` | `/users/:id` | Update user | `Bearer Token` | Param: `id`, Body: `UpdateUserDto` | `200`, `401`, `404` |
| `DELETE` | `/users/:id` | Delete user | `@Roles(admin)` | Param: `id` | `200`, `401`, `403`, `404` |

---

### 3.4. Service Providers (`/providers`) (5 URLs)
Manages service provider profiles, assigned services, working hours, and operational locations.

| Method | Path | Summary | Access / RBAC | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/providers` | Create provider profile | `@Roles(admin, provider)` | Body: `CreateProviderDto` (`user`, `offeredServices[]`, `experience`, `workHourStart`, `workHourEnd`, `workingDays[]`, `location`) | `201`, `400`, `401`, `403` |
| `GET` | `/providers` | Get all providers | `@Roles(admin, manager)` | None | `200`, `401`, `403` |
| `GET` | `/providers/:id` | Get provider by ID | `@Roles(admin, manager, provider)` | Param: `id` (Mongo ObjectId) | `200`, `401`, `403`, `404` |
| `PATCH` | `/providers/:id` | Update provider | `@Roles(admin, manager, provider)` | Param: `id`, Body: `UpdateProviderDto` | `200`, `401`, `403`, `404` |
| `DELETE` | `/providers/:id` | Delete provider | `@Roles(admin)` | Param: `id` | `200`, `401`, `403`, `404` |

---

### 3.5. Regional Managers (`/managers`) (5 URLs)
Manages authorized individuals representing provider collectives in specific geographic zones.

| Method | Path | Summary | Access / RBAC | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/managers` | Create manager profile | `@Roles(admin)` | Body: `CreateManagerDto` (`user`, `salary`, `experience`, `location`) | `201`, `400`, `401`, `403` |
| `GET` | `/managers` | Get all managers | `@Roles(admin)` | None | `200`, `401`, `403` |
| `GET` | `/managers/:id` | Get manager by ID | `@Roles(admin, manager)` | Param: `id` (Mongo ObjectId) | `200`, `401`, `403`, `404` |
| `PATCH` | `/managers/:id` | Update manager | `@Roles(admin, manager)` | Param: `id`, Body: `UpdateManagerDto` | `200`, `401`, `403`, `404` |
| `DELETE` | `/managers/:id` | Delete manager | `@Roles(admin)` | Param: `id` | `200`, `401`, `403`, `404` |

---

### 3.6. Service Regions (`/regions`) (5 URLs)
Operational areas and geographical boundaries overseen by managers.

| Method | Path | Summary | Access / RBAC | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/regions` | Create region | `@Roles(admin)` | Body: `CreateRegionDto` (`name`, `manager`, `location`, `isActive?`) | `201`, `400`, `401`, `403` |
| `GET` | `/regions` | Get all regions | `@Public()` | None | `200` |
| `GET` | `/regions/:id` | Get region by ID | `@Public()` | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/regions/:id` | Update region | `@Roles(admin, manager)` | Param: `id`, Body: `UpdateRegionDto` | `200`, `401`, `403`, `404` |
| `DELETE` | `/regions/:id` | Delete region | `@Roles(admin)` | Param: `id` | `200`, `401`, `403`, `404` |

---

### 3.7. Service Categories (`/categories`) (5 URLs)
High-level taxonomical groupings of services (e.g., Cleaning, Electrical, Plumbing, Appliance Repair).

| Method | Path | Summary | Access / RBAC | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/categories` | Create category | `@Roles(admin)` | Body: `CreateCategoryDto` (`name`, `description`, `imageUrl`, `isActive?`) | `201`, `400`, `401`, `403` |
| `GET` | `/categories` | Get all categories | `@Public()` | None | `200` |
| `GET` | `/categories/:id` | Get category by ID | `@Public()` | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/categories/:id` | Update category | `@Roles(admin)` | Param: `id`, Body: `UpdateCategoryDto` | `200`, `401`, `403`, `404` |
| `DELETE` | `/categories/:id` | Delete category | `@Roles(admin)` | Param: `id` | `200`, `401`, `403`, `404` |

---

### 3.8. Services Catalog (`/services`) (5 URLs)
Individual bookable services including duration, pricing in paise, coverage bullet points, and FAQs.

| Method | Path | Summary | Access / RBAC | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/services` | Create service offering | `@Roles(admin)` | Body: `CreateServiceDto` (`name`, `category`, `description`, `price`, `duration`, `imageUrls?`, `whatIsCovered?`, `whatIsNotCovered?`, `howItWorks?`, `faq?`, `isActive?`) | `201`, `400`, `401`, `403` |
| `GET` | `/services` | Get all services | `@Public()` | None | `200` |
| `GET` | `/services/:id` | Get service by ID | `@Public()` | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/services/:id` | Update service | `@Roles(admin)` | Param: `id`, Body: `UpdateServiceDto` | `200`, `401`, `403`, `404` |
| `DELETE` | `/services/:id` | Delete service | `@Roles(admin)` | Param: `id` | `200`, `401`, `403`, `404` |

---

### 3.9. Orders (`/orders`) (5 URLs)
Customer checkout batches snapshotting immutable delivery address, total paise, and 15-minute expiration timers.

| Method | Path | Summary | Access / RBAC | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/orders` | Create order | `Bearer Token` | Body: `CreateOrderDto` (`customer`, `address`, `totalAmount`, `expiresAt`) | `201`, `400`, `401` |
| `GET` | `/orders` | Get all orders | `Bearer Token` | None | `200`, `401` |
| `GET` | `/orders/:id` | Get order by ID | `Bearer Token` | Param: `id` (Mongo ObjectId) | `200`, `401`, `404` |
| `PATCH` | `/orders/:id` | Update order | `Bearer Token` | Param: `id`, Body: `UpdateOrderDto` | `200`, `401`, `404` |
| `DELETE` | `/orders/:id` | Delete order | `Bearer Token` | Param: `id` | `200`, `401`, `404` |

---

### 3.10. Bookings (`/bookings`) (5 URLs)
Discrete service appointments on the 30-minute slot grid, provider travel buffer, and fee splits.

| Method | Path | Summary | Access / RBAC | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/bookings` | Create booking | `Bearer Token` | Body: `CreateBookingDto` (`service`, `provider`, `customer`, `order`, `region`, `scheduledDate`, `startTime`, `endTime`, `blockStartTime`, `price`, `platformFeePercent`, `platformShare`, `providerShare`) | `201`, `400`, `401` |
| `GET` | `/bookings` | Get all bookings | `Bearer Token` | None | `200`, `401` |
| `GET` | `/bookings/:id` | Get booking by ID | `Bearer Token` | Param: `id` (Mongo ObjectId) | `200`, `401`, `404` |
| `PATCH` | `/bookings/:id` | Update booking | `Bearer Token` | Param: `id`, Body: `UpdateBookingDto` | `200`, `401`, `404` |
| `DELETE` | `/bookings/:id` | Delete booking | `Bearer Token` | Param: `id` | `200`, `401`, `404` |

---

### 3.11. Payments (`/payments`) (5 URLs)
Razorpay order transactions, payment IDs, capture verifications, and automated refunds.

| Method | Path | Summary | Access / RBAC | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/payments` | Initialize payment | `Bearer Token` | Body: `CreatePaymentDto` (`order`, `totalAmount`, `currency?`, `razorpayOrderId`) | `201`, `400`, `401` |
| `GET` | `/payments` | Get all payments | `Bearer Token` | None | `200`, `401` |
| `GET` | `/payments/:id` | Get payment by ID | `Bearer Token` | Param: `id` (Mongo ObjectId) | `200`, `401`, `404` |
| `PATCH` | `/payments/:id` | Update payment | `Bearer Token` | Param: `id`, Body: `UpdatePaymentDto` | `200`, `401`, `404` |
| `DELETE` | `/payments/:id` | Delete payment | `Bearer Token` | Param: `id` | `200`, `401`, `404` |

---

### 3.12. Reviews (`/reviews`) (5 URLs)
Verified customer feedback and 1-5 star ratings for completed bookings.

| Method | Path | Summary | Access / RBAC | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/reviews` | Submit review | `@Roles(customer, admin)` | Body: `CreateReviewDto` (`booking`, `rating`, `review?`, `provider`, `service`) | `201`, `400`, `401`, `403` |
| `GET` | `/reviews` | Get all reviews | `@Public()` | None | `200` |
| `GET` | `/reviews/:id` | Get review by ID | `@Public()` | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/reviews/:id` | Update review | `@Roles(customer, admin)` | Param: `id`, Body: `UpdateReviewDto` | `200`, `401`, `403`, `404` |
| `DELETE` | `/reviews/:id` | Delete review | `@Roles(admin)` | Param: `id` | `200`, `401`, `403`, `404` |

---

### 3.13. Provider Unavailability (`/unavailability`) (5 URLs)
Calendar blackout periods preventing auto-assignment and customer bookings during time-off.

| Method | Path | Summary | Access / RBAC | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/unavailability` | Create unavailability block | `@Roles(provider, admin)` | Body: `CreateUnavailabilityDto` (`provider`, `date`, `startTime`, `endTime`, `reason?`) | `201`, `400`, `401`, `403` |
| `GET` | `/unavailability` | Get all unavailability records | `@Roles(provider, manager, admin)` | None | `200`, `401`, `403` |
| `GET` | `/unavailability/:id` | Get unavailability by ID | `@Roles(provider, manager, admin)` | Param: `id` (Mongo ObjectId) | `200`, `401`, `403`, `404` |
| `PATCH` | `/unavailability/:id` | Update unavailability | `@Roles(provider, admin)` | Param: `id`, Body: `UpdateUnavailabilityDto` | `200`, `401`, `403`, `404` |
| `DELETE` | `/unavailability/:id` | Delete unavailability | `@Roles(provider, admin)` | Param: `id` | `200`, `401`, `403`, `404` |

---

### 3.14. Platform Settings (`/platform-settings`) (5 URLs)
Global parameters governing commissions, dispatch radius, slot increments, lead times, and dispatch timeouts.

| Method | Path | Summary | Access / RBAC | Request Body / Params | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/platform-settings` | Create settings | `@Roles(admin)` | Body: `CreatePlatformSettingDto` (`platformFeePercent`, `maxAssignmentDistanceKm`, `slotIntervalMinutes`, `firstSlotStart`, `lastSlotStart`, `bookingWindowDays`, `minLeadMinutes`, `travelBufferMinutes`, `offerTimeoutMinutes`) | `201`, `400`, `401`, `403` |
| `GET` | `/platform-settings` | Get all settings | `@Public()` | None | `200` |
| `GET` | `/platform-settings/:id` | Get setting by ID | `@Public()` | Param: `id` (Mongo ObjectId) | `200`, `404` |
| `PATCH` | `/platform-settings/:id` | Update setting | `@Roles(admin)` | Param: `id`, Body: `UpdatePlatformSettingDto` | `200`, `401`, `403`, `404` |
| `DELETE` | `/platform-settings/:id` | Delete setting | `@Roles(admin)` | Param: `id` | `200`, `401`, `403`, `404` |

---

## 4. Key Data Formats & Conventions

1. **Bearer Token Authentication**:
   - Provide standard HTTP header: `Authorization: Bearer <JWT_ACCESS_TOKEN>`.
   - No `x-role` or custom header needed.
2. **Currency**: All amounts (such as `price`, `totalAmount`, `salary`, `platformShare`, `providerShare`) are stored and transmitted as integers in **paise** (1 INR = 100 paise; e.g. ₹499 = `49900`).
3. **Time and Slots**:
   - `scheduledDate`: ISO 8601 UTC date string marking midnight of the IST calendar day (e.g. `2026-10-15T00:00:00.000Z`).
   - `startTime` / `endTime` / `blockStartTime`: Integers representing **minutes from midnight** (e.g., `480` = 08:00 AM, `570` = 09:30 AM, `1200` = 08:00 PM).
4. **Geographic Coordinates**:
   - Standard GeoJSON `Point`: `{ "type": "Point", "coordinates": [longitude, latitude] }`.
5. **Validation & Errors**:
   - Strict `ValidationPipe` with `{ whitelist: true, forbidNonWhitelisted: true }` rejects undeclared fields with `400 Bad Request`.
   - Global `AllExceptionsFilter` normalizes error responses into a consistent JSON payload with correlation `requestId` and timestamp.
