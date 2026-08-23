# TatkuUnited — Middleware & Log/Error Management Audit

**Project**: `d:\20_TatkuUnited\back-end` (NestJS 11 + TypeScript)  
**Date**: 2026-08-23

---

## Summary Scorecard

| # | Requirement | Status | Details |
|---|-------------|--------|---------|
| 1 | **Logging Middleware** | ❌ Missing | No request/response logging middleware exists |
| 2 | **Error Handling Middleware** | ❌ Missing | No global `ExceptionFilter`; errors handled ad-hoc in controllers |
| 3 | **File Upload Middleware** | ❌ Missing | No `multer`/`FileInterceptor` usage in any controller |
| 4 | **JWT (Security)** | ✅ Present | Full Passport-JWT setup with `JwtAuthGuard`, `JwtStrategy`, `AuthModule` |
| 5 | **Helmet (Security)** | ❌ Missing | `helmet` package not installed, not applied in `main.ts` |
| 6 | **CORS (Security)** | ✅ Present | Configured in `main.ts` with origin regex restricting to localhost |
| 7 | **CSRF (Security)** | ❌ Missing | No CSRF token generation, validation, or package installed |
| 8 | **Router-level Middleware (Custom Router)** | ❌ Missing | No `NestMiddleware` classes; no `configure()` in any module |
| 9 | **Log & Error files at regular intervals** | ❌ Missing | Only `console.log` used; no file-based logging or rotation |

> [!CAUTION]
> **5 out of 9 mandatory items are completely missing.** Only JWT and CORS are fully implemented.

---

## Detailed Findings

### 1. Logging Middleware — ❌ MISSING

**What's expected:** A dedicated middleware class (implementing `NestMiddleware`) that intercepts every HTTP request and logs the method, URL, status code, response time, IP address, etc.

**What exists:** Scattered `console.log()` statements in a few service files:
- [revenue-ledger.service.ts](file:///d:/20_TatkuUnited/back-end/src/modules/revenue-ledger/revenue-ledger.service.ts) — line 67
- [revenue-ledger.controller.ts](file:///d:/20_TatkuUnited/back-end/src/modules/revenue-ledger/revenue-ledger.controller.ts) — lines 62, 65
- [cart.controller.ts](file:///d:/20_TatkuUnited/back-end/src/modules/cart/cart.controller.ts) — line 50
- [database.service.ts](file:///d:/20_TatkuUnited/back-end/src/common/database/database.service.ts) — lines 356, 421

**What's needed:**
- A `LoggerMiddleware` class in `src/common/middleware/logger.middleware.ts`
- Apply it globally via `AppModule.configure()` for all routes
- Integrate with a proper logging library (e.g., Winston or Pino)

---

### 2. Error Handling Middleware — ❌ MISSING

**What's expected:** A global `ExceptionFilter` (using `@Catch()` decorator) that intercepts all exceptions, formats consistent error responses, and logs errors to files.

**What exists:** Ad-hoc `try/catch` blocks in individual controllers:
- [unit-managers.controller.ts](file:///d:/20_TatkuUnited/back-end/src/modules/unit-managers/unit-managers.controller.ts) — line 54
- [transactions.controller.ts](file:///d:/20_TatkuUnited/back-end/src/modules/transactions/transactions.controller.ts) — line 78
- [service-providers.controller.ts](file:///d:/20_TatkuUnited/back-end/src/modules/service-providers/service-providers.controller.ts) — line 57

NestJS's default built-in exception filter handles unhandled errors, but there is **no custom filter** registered.

**What's needed:**
- An `AllExceptionsFilter` in `src/common/filters/all-exceptions.filter.ts`
- Register it globally via `app.useGlobalFilters()` in `main.ts`
- Log all errors (with stack traces) to an error log file

---

### 3. File Upload Middleware — ❌ MISSING

**What's expected:** At least one endpoint using `@UseInterceptors(FileInterceptor())` or `FilesInterceptor()` with multer for handling file uploads (e.g., profile pictures, documents).

**What exists:** `multer` is available as a transitive dependency of `@nestjs/platform-express` (found in `package-lock.json`), but **no controller or route uses `FileInterceptor`, `@UploadedFile()`, or any file-upload related decorator**.

**What's needed:**
- Add file upload functionality to at least one relevant endpoint (e.g., profile photo upload, document upload)
- Configure multer storage (disk/memory), file size limits, and MIME type validation
- Use `@UseInterceptors(FileInterceptor('file'))` and `@UploadedFile()` decorators

---

### 4. JWT Security — ✅ PRESENT

**Evidence:**
- **Package**: `@nestjs/jwt` (v11.0.2), `@nestjs/passport` (v11.0.5), `passport-jwt` (v4.0.1) installed
- **Strategy**: [jwt.strategy.ts](file:///d:/20_TatkuUnited/back-end/src/modules/auth/jwt.strategy.ts) — Passport JWT strategy with token extraction from `Authorization: Bearer <token>` header
- **Guard**: [jwt-auth.guard.ts](file:///d:/20_TatkuUnited/back-end/src/modules/auth/jwt-auth.guard.ts) — Extends `AuthGuard('jwt')` with `@Public()` bypass
- **Module**: [auth.module.ts](file:///d:/20_TatkuUnited/back-end/src/modules/auth/auth.module.ts) — Registers JWT with 24h expiry
- **Auth Flow**: [auth.service.ts](file:///d:/20_TatkuUnited/back-end/src/modules/auth/auth.service.ts) — Full login, register, `getMe`, and `changePassword` flows
- **Role-based access**: [roles.guard.ts](file:///d:/20_TatkuUnited/back-end/src/common/guards/roles.guard.ts) — Global `APP_GUARD` with role-based authorization, maintenance mode check, and `@Public()` bypass
- **Public route decorator**: [public.decorator.ts](file:///d:/20_TatkuUnited/back-end/src/common/decorators/public.decorator.ts)

> [!NOTE]
> JWT secret is hardcoded as `'tatku-dev-jwt-secret'` with env fallback. This is acceptable for development but should be a mandatory env var in production.

---

### 5. Helmet Security — ❌ MISSING

**What's expected:** The `helmet` npm package should be installed and applied via `app.use(helmet())` in `main.ts` to set security-related HTTP headers (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, etc.).

**What exists:** `helmet` is **not** in `package.json` dependencies. No reference to it anywhere in the codebase.

**What's needed:**
```bash
npm install helmet
```
```typescript
// main.ts
import helmet from 'helmet';
app.use(helmet());
```

---

### 6. CORS Security — ✅ PRESENT

**Evidence** in [main.ts](file:///d:/20_TatkuUnited/back-end/src/main.ts#L14-L23):
```typescript
app.enableCors({
  origin: (origin, callback) => {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked: ' + origin));
    }
  },
  credentials: true,
});
```

- ✅ Restricts origins to localhost/127.0.0.1 during development
- ✅ Blocks unknown origins
- ✅ Credentials enabled

> [!NOTE]
> Public-facing APIs (services, categories, reviews) are exposed via `@Public()` decorator, effectively making them accessible without auth. CORS policy still applies at the HTTP level.

---

### 7. CSRF Security — ❌ MISSING

**What's expected:** CSRF token generation and validation middleware (e.g., `csurf` or `csrf-csrf` package) to protect state-changing endpoints from cross-site request forgery.

**What exists:** No CSRF-related packages installed. No CSRF token generation or validation anywhere.

**What's needed:**
- Install a CSRF package (e.g., `csrf-csrf` as `csurf` is deprecated)
- Generate CSRF tokens on a dedicated endpoint
- Validate CSRF tokens on all non-GET/HEAD/OPTIONS requests
- Exclude specific API routes if they are purely for programmatic (non-browser) access

---

### 8. Router-Level Middleware (Custom Router) — ❌ MISSING

**What's expected:** Custom NestJS middleware classes (implementing `NestMiddleware`) applied at the router level via `MiddlewareConsumer.apply().forRoutes()` in module `configure()` methods. For example, an authentication middleware for specific route groups, or request-scoped data injection middleware.

**What exists:** 
- The project uses **Guards** (`JwtAuthGuard`, `RolesGuard`) and **Interceptors** (`SpIdAliasInterceptor`) for cross-cutting concerns — these are NestJS-specific mechanisms but are **not middleware classes**.
- No module in the project implements `NestModule` with a `configure(consumer: MiddlewareConsumer)` method.

**What's needed:**
- At least one custom middleware implementing `NestMiddleware` (e.g., a request-logging middleware, or an API-key validation middleware)
- Apply it to specific route groups using `consumer.apply(MyMiddleware).forRoutes('route-prefix')`
- Demonstrate router-level scoping (not just global)

---

### 9. Log & Error File Storage at Regular Intervals — ❌ MISSING

**What's expected:** 
- Application logs (access logs, info, warnings) written to files
- Error logs written to separate error files
- Log rotation at regular intervals (daily, hourly, or by file size)
- Libraries like **Winston** (with `winston-daily-rotate-file` transport) or **Pino** (with `pino-roll`)

**What exists:** All logging is done via `console.log()` which goes to stdout only. No file-based logging, no log rotation, no structured logging.

**What's needed:**
- Install Winston: `npm install winston winston-daily-rotate-file`
- Create a `LoggerService` that writes to:
  - `logs/app-YYYY-MM-DD.log` — all logs
  - `logs/error-YYYY-MM-DD.log` — error-level logs only
- Configure daily rotation with max file retention
- Integrate with the global `ExceptionFilter` (item #2)
- Replace all `console.log` calls with the structured logger

---

## Quick Reference — Files That Need Changes

| File | Changes Required |
|------|-----------------|
| `package.json` | Add `helmet`, `csrf-csrf`, `winston`, `winston-daily-rotate-file`, `multer` (as direct dep) |
| `main.ts` | Apply `helmet()`, CSRF middleware, global exception filter, Winston logger |
| `app.module.ts` | Implement `NestModule.configure()` for router-level middleware |
| **NEW** `src/common/middleware/logger.middleware.ts` | HTTP request logging middleware |
| **NEW** `src/common/filters/all-exceptions.filter.ts` | Global exception filter |
| **NEW** `src/common/logger/logger.service.ts` | Winston-based file logger with rotation |
| **NEW** `src/common/middleware/csrf.middleware.ts` | CSRF token validation |
| At least one controller | Add `@UseInterceptors(FileInterceptor(...))` for file upload |
