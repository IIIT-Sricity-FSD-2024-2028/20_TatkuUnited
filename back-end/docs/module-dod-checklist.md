# Module Definition of Done (DoD)

Use this checklist before marking any backend module as complete.

## 1) API Contract

- [ ] Controller routes are versioned/prefixed consistently (for example, `/v1/<resource>` if your project convention uses versioning).
- [ ] Request/response DTOs are finalized and shared with frontend.
- [ ] Pagination shape is consistent across list endpoints.
- [ ] Error response shape matches global standard (same keys and structure).

## 2) Validation and DTOs

- [ ] Every write endpoint (`POST`, `PUT`, `PATCH`) uses DTO classes with `class-validator`.
- [ ] No raw `any` payload handling in controllers/services.
- [ ] Validation behavior works with global `ValidationPipe` (`whitelist: true`, `transform: true`).
- [ ] Enum fields use strict enums (no free-form strings for status/role-like values).

## 3) Authorization (RBAC)

- [ ] Each protected endpoint uses `@Roles(...)` explicitly.
- [ ] Allowed roles match the authorization matrix in `back-end/docs/authorization-matrix.md`.
- [ ] Swagger endpoint docs include role expectations (`x-role` header behavior).
- [ ] Forbidden access returns `403` reliably for disallowed roles.

## 4) Service and Repository Quality

- [ ] Service layer enforces business rules (not controller layer).
- [ ] Repository calls are scoped and deterministic (no hidden side effects).
- [ ] IDs are created with `DatabaseService.genId()` where applicable.
- [ ] Timestamps use ISO strings and `DatabaseService.now()` where applicable.

## 5) Errors and Edge Cases

- [ ] `404` for missing resources.
- [ ] `400` for invalid state transitions/input.
- [ ] `409` for duplicate/conflict cases where relevant.
- [ ] Module handles empty-state responses cleanly (no crashes/null access).

## 6) Swagger and Discoverability

- [ ] Module is tagged with `@ApiTags`.
- [ ] Each endpoint has summary/description and request/response schema.
- [ ] Security metadata is correct (`bearer` and/or `x-role` as applicable).
- [ ] Generated `back-end/docs/swagger.json` includes the new endpoints.

## 7) Tests (Minimum Bar)

- [ ] Unit tests for service business rules.
- [ ] Guard-level tests for role restrictions (happy + forbidden paths).
- [ ] E2E smoke tests for module CRUD/use-cases.
- [ ] Validation failure test for at least one invalid payload per write endpoint.

## 8) Domain Integrity

- [ ] Foreign-key-like references are valid against seeded/in-memory data.
- [ ] Role hierarchy assumptions are explicit (not implied in random code paths).
- [ ] Status transitions are documented and tested.
- [ ] Revenue/assignment logic uses shared constants, not hardcoded percentages in module code.

## 9) Operational Readiness

- [ ] Logs are meaningful for key actions (create, update status, assign, cancel, payout).
- [ ] No sensitive fields leaked in responses (password hash, secrets, internal tokens).
- [ ] CORS/auth assumptions for frontend integration are documented.
- [ ] README/docs updated with examples for the module.

## Final Gate

Only mark a module complete when all applicable items are checked. If an item is not applicable, add a short note explaining why.
