# Providers Backend Guide

## Purpose

This document explains how the existing NestJS `providers` module is used from the React frontend. It documents the relationship between the DTO, schema, service, controller, HTTP API, and React state.

## Request and response flow

```text
React request body
  -> NestJS controller route
  -> DTO validation
  -> ProvidersService
  -> Mongoose schema/model
  -> MongoDB
  -> JSON response
  -> React state
  -> React component
```

## Relevant files

| File                                          | When to inspect it                             | What to look for                                             |
| --------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `src/providers/dto/create-provider.dto.ts`  | Before sending`POST /providers`              | Required fields and validation rules                         |
| `src/providers/dto/update-provider.dto.ts`  | Before sending`PATCH /providers/:id`         | Optional fields allowed during updates                       |
| `src/providers/entities/provider.entity.ts` | When locating the provider entity              | This file re-exports the provider schema                     |
| `src/schema/provider.schema.ts`             | When understanding stored or returned data     | MongoDB fields, defaults, relations, indexes, and timestamps |
| `src/providers/providers.service.ts`        | When understanding database behavior           | Queries, user population, and not-found behavior             |
| `src/providers/providers.controller.ts`     | When calling the API                           | HTTP methods, URLs, route parameters, and DTO usage          |
| `src/providers/providers.module.ts`         | When changing backend wiring                   | Controller, service, database module, and exports            |
| `src/main.ts`                               | When configuring the frontend/backend boundary | Port, CORS, validation, and error responses                  |
| `src/app.module.ts`                         | When checking global backend configuration     | MongoDB, configuration, throttling, and module registration  |

## DTO: request validation

`CreateProviderDto` requires:

```ts
{
  user: string;
  offeredServices: string[];
  experience: number;
  workHourStart: number;
  workHourEnd: number;
  workingDays: number[];
  location: {
    type: string;
    coordinates: [number, number];
  };
}
```

Important rules:

- `user` must be a MongoDB ObjectId.
- Every `offeredServices` value must be a MongoDB ObjectId.
- `workHourStart` and `workHourEnd` are minutes from midnight.
- `workingDays` uses `0 = Sunday` through `6 = Saturday`.
- GeoJSON coordinates use `[longitude, latitude]`.

`UpdateProviderDto` makes the editable provider fields optional. It supports:

```ts
{
  offeredServices?: string[];
  experience?: number;
  workHourStart?: number;
  workHourEnd?: number;
  workingDays?: number[];
  location?: {
    type?: string;
    coordinates: [number, number];
  };
  status?: "pending" | "approved" | "suspended";
  razorpayAccountId?: string;
  region?: string;
}
```

The `user` field cannot be changed through this update DTO.

## Entity/schema: MongoDB data

The actual Mongoose schema is `src/schema/provider.schema.ts`. It contains:

- `user`: reference to a `User`
- `offeredServices`: references to `Service` documents
- `experience`
- `workHourStart`
- `workHourEnd`
- `workingDays`
- `location`
- `status`
- `rating`
- `ratingCount`
- `region`
- `razorpayAccountId`
- `createdAt` and `updatedAt`, added by timestamps

The `user` field is unique, so one user cannot have multiple provider profiles.

## Service: database operations

`ProvidersService` performs the database operations:

- `create()` creates a provider document.
- `findAll()` retrieves all providers and populates `user`, excluding the password.
- `findOne()` retrieves one provider and throws a 404 if it does not exist.
- `update()` updates a provider by MongoDB ID and returns the updated document.
- `remove()` deletes a provider by MongoDB ID and returns the deleted document.

## Module wiring

`ProvidersModule` imports the database module, registers `ProvidersController`, provides `ProvidersService`, and exports the service for use by other backend modules.

No module modification is required for normal React API consumption.

## API base URL

The backend runs on port `3000` by default and does not use a global `/api` prefix:

```text
http://localhost:3000/providers
```

## API endpoints

| Operation              |     Method | Endpoint           |
| ---------------------- | ---------: | ------------------ |
| Retrieve all providers |    `GET` | `/providers`     |
| Retrieve one provider  |    `GET` | `/providers/:id` |
| Create a provider      |   `POST` | `/providers`     |
| Update a provider      |  `PATCH` | `/providers/:id` |
| Delete a provider      | `DELETE` | `/providers/:id` |

## Example create request

```json
{
  "user": "665000000000000000000001",
  "offeredServices": [
    "665000000000000000000010"
  ],
  "experience": 3,
  "workHourStart": 480,
  "workHourEnd": 1200,
  "workingDays": [1, 2, 3, 4, 5],
  "location": {
    "type": "Point",
    "coordinates": [80.123, 17.456]
  }
}
```

## Example update request

```json
{
  "experience": 4,
  "workHourStart": 540,
  "status": "approved"
}
```

## Response behavior

`GET /providers` returns an array of provider documents. A provider can contain:

```json
{
  "_id": "provider-object-id",
  "user": {
    "_id": "user-object-id",
    "email": "user@example.com"
  },
  "offeredServices": ["service-object-id"],
  "experience": 3,
  "workHourStart": 480,
  "workHourEnd": 1200,
  "workingDays": [1, 2, 3, 4, 5],
  "location": {
    "type": "Point",
    "coordinates": [80.123, 17.456]
  },
  "status": "pending",
  "rating": 0,
  "ratingCount": 0,
  "createdAt": "2026-10-11T00:00:00.000Z",
  "updatedAt": "2026-10-11T00:00:00.000Z"
}
```

The exact populated user fields depend on the User schema.

The successful response is currently the raw array or document. Although a `TransformInterceptor` exists, it is not registered globally in `main.ts`.

## Errors

The global exception filter returns errors in this shape:

```TypeScript
{
  "statusCode": 400,
  "timestamp": "2026-10-11T00:00:00.000Z",
  "path": "/providers",
  "method": "POST",
  "requestId": "...",
  "error": "BadRequestException",
  "message": "..."
}
```

The global validation pipe:

- strips unknown properties;
- rejects non-whitelisted properties;
- transforms request values;
- validates DTO fields.

## Authentication

The current providers controller does not use `@Public()` or `@UseGuards()`. The global application module registers the throttling guard, but it does not currently register `JwtAuthGuard` globally.

Based on the current code, provider endpoints do not require a bearer token. If authentication is enabled later, send:

```http
Authorization: Bearer <jwt-token>
```

## CORS

`main.ts` enables CORS. If `CORS_ORIGIN` is set, the React origin must be included:

```env
CORS_ORIGIN=http://localhost:5173
```

The backend allows `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS`, and allows the `Content-Type` and `Authorization` headers.
