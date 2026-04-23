# Authorization Matrix (RBAC)

This document defines who can do what at the API layer.

## Roles

- `super_user`
- `collective_manager`
- `unit_manager`
- `service_provider`
- `customer`

Role hierarchy (broad authority intent):

`super_user > collective_manager > unit_manager > service_provider > customer`

Important: hierarchy is a domain concept, not automatic code behavior. Endpoint access must still be declared explicitly using `@Roles(...)`.

## Header-Based Role for Current Stage

Current guard reads role from request header:

- Header: `x-role`
- Example: `x-role: unit_manager`

When JWT is present, guard may also read role from token payload depending on implementation. During team integration, continue documenting endpoint permissions in terms of the five canonical roles above.

---

## Resource-Level Permissions

Legend:

- `C` = Create
- `R` = Read
- `U` = Update
- `D` = Delete
- `M` = Manage / Approve / Assign (non-CRUD admin actions)

### Accounts and Identity

| Resource / Action | super_user | collective_manager | unit_manager | service_provider | customer |
|---|---|---|---|---|---|
| Super user accounts | CRUD | - | - | - | - |
| Collective manager accounts | CRUD | R (self) U (self) | - | - | - |
| Unit manager accounts | CRUD | M (assign/manage under collective) | R (self) U (self) | - | - |
| Service provider accounts | CRUD | M (approve/manage in collective scope) | M (add/remove in unit scope) | R (self) U (self) deactivate-self | - |
| Customer accounts | CRUD | - | - | - | R (self) U (self) D (self) |
| Password change | All roles (self) |

### Geography and Organization

| Resource / Action | super_user | collective_manager | unit_manager | service_provider | customer |
|---|---|---|---|---|---|
| Sectors | CRUD | M (manage sectors in collective scope) | R | R | R |
| Collectives | CRUD | R (own) U (own profile/settings) | R (related) | R (related) | R (public metadata if exposed) |
| Units | CRUD | M (create/manage under own collective) | M (manage own unit settings) | R (own unit) | R (if surfaced) |

### Service Catalog

| Resource / Action | super_user | collective_manager | unit_manager | service_provider | customer |
|---|---|---|---|---|---|
| Categories | CRUD | R | R | R | R |
| Services | CRUD | R | R | R | R |
| Skills | CRUD | R | R | R | R |
| Provider skills | CRUD | M (verify requests in collective scope) | R | M (request verification for self) | - |

### Availability, Booking, and Fulfillment

| Resource / Action | super_user | collective_manager | unit_manager | service_provider | customer |
|---|---|---|---|---|---|
| Provider unavailability | CRUD | R (providers in scope) | R (providers in unit) | CRUD (self) | - |
| Cart | CRUD (support/debug) | - | - | - | CRUD (self) |
| Bookings | CRUD | R/M (in collective scope) | R/M (in unit scope) | R (assigned jobs only) | C/R/U-cancel (self) |
| Job assignments | CRUD | R/M (monitor/escalate in scope) | R/M (monitor in unit scope) | R/U status (assigned only) | R (own booking visibility) |

### Payments, Revenue, and Reviews

| Resource / Action | super_user | collective_manager | unit_manager | service_provider | customer |
|---|---|---|---|---|---|
| Transactions | CRUD | R (in collective scope) | R (in unit scope) | R (own jobs if exposed) | C/R (self) |
| Revenue ledger | CRUD | R (own collective share/charts) | R (own unit share/charts) | R (own share/charts) | - |
| Reviews | CRUD | R | R | R | C/R/U/D (self, for eligible completed services) |
| Platform settings | CRUD | - | - | - | - |

---

## Endpoint Annotation Pattern

Use explicit decorators per route, for example:

```ts
@Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER)
```

Do not rely on unstated inheritance. If an endpoint should be accessible by multiple roles, list every allowed role.

## Recommended Guard Testing Pattern

For each protected endpoint:

1. Allowed role returns success (`2xx`/expected).
2. Disallowed role returns `403`.
3. Missing `x-role` (and no JWT role) returns `403`.
4. Invalid role string returns `403`.

## Team Rule

Any PR adding/changing endpoints must include:

- Updated `@Roles(...)` on affected routes
- Updated test coverage for access behavior
- Matrix update in this file if permission policy changed
