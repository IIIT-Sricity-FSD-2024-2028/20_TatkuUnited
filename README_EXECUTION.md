# Tatku United — Execution Guide & Team Contributions

A comprehensive technical execution manual, setup guide, and individual contributions ledger for **Tatku United: Digital Marketplace for Non-Retail Services**.

---

## 1. System Architecture & Prerequisites

### 1.1 Architecture Overview

The platform consists of a decoupled, full-stack architecture:

- **Backend**: Built with **NestJS (Node.js/TypeScript)**, employing **Mongoose (MongoDB)** for data persistence, JWT-based authentication, Role-Based Access Control (RBAC), and Helmet/Throttler security middlewares.
- **Frontend**: Built with **React 19, TypeScript, and Vite**, utilizing **Tailwind CSS v4**, **Shadcn UI** component primitives, and **Redux Toolkit** / React Context for state management.
- **Database**: **MongoDB** (Replica Set required for multi-document ACID transactions during booking and checkout).

### 1.2 Prerequisites

Ensure the following tools and runtimes are installed on your system before proceeding:

- **Runtime**: [Node.js](https://nodejs.org/) (v18.0.0 or higher, recommended v20+) OR [Bun](https://bun.sh/) (v1.0+)
- **Package Manager**: `bun`, `npm`, or `pnpm` (bun and pnpm supported)
- **Database Engine**: [MongoDB Community Server](https://www.mongodb.com/try/download/community) (v6.0+) or a free [MongoDB Atlas Cluster](https://www.mongodb.com/atlas)
- **Database CLI**: `mongosh` (MongoDB Shell) for running database initialization and seed scripts
- **API Client**: Web browser or [Postman](https://www.postman.com/) (Interactive Swagger UI is also built-in)

---

## 2. Environment Configuration

### 2.1 Backend Environment Setup (`back-end/.env`)

Navigate to the `back-end` directory and create a `.env` file (or duplicate `.env.example`):

```bash
cd back-end
cp .env.example .env
```

Configure the environment variables in `back-end/.env`:

```env
# MongoDB Connection String (Must support replica set / transactions)
# Local Replica Set Example: mongodb://127.0.0.1:27017/tatku_united?replicaSet=rs0
# MongoDB Atlas Example:
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/tatku_united?retryWrites=true&w=majority

# Application Port & Environment
PORT=3000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=super_secret_jwt_key_tatku_united_2026
JWT_EXPIRES_IN=7d

# Cloudinary (Optional - For Image & Proof Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay (Optional - For Payment Gateway Mock/Live Integration)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 2.2 Frontend Configuration (`react-frontend`)

The React frontend communicates with the backend via `react-frontend/src/common/endpoints.ts`.
By default, the backend API URL is configured to:

```typescript
export const BASE_URL = "http://localhost:3000";
```

If your backend is running on a different port or host, update `BASE_URL` in `react-frontend/src/common/endpoints.ts`.

---

## 3. Database Initialization & Seeding

The platform provides a 5-layer incremental seed system in `back-end/database/seed/` to populate realistic users, categories, services, manager territories, providers, bookings, and active customer carts.

Execute the seed scripts in sequential order using `mongosh`:

```bash
# Set your connection string URI (e.g. Atlas URI or local MongoDB)
# Replace <MONGODB_URI> with your actual connection string

# 1. Seed Users (Admin, Managers, Providers, Customers)
mongosh "<MONGODB_URI>" --file back-end/database/seed/seed-users.js

# 2. Seed Catalog (Categories & Services with FAQs, Coverage, and Pricing)
mongosh "<MONGODB_URI>" --file back-end/database/seed/seed-catalog.js

# 3. Seed Layer 2 (Managers, Regional Zones, and Service Providers)
mongosh "<MONGODB_URI>" --file back-end/database/seed/seed-layer2.js

# 4. Seed Layer 3 (Orders, Bookings, Completed Jobs, Reviews, and Ledgers)
mongosh "<MONGODB_URI>" --file back-end/database/seed/seed-layer3.js

# 5. Seed Layer 4 (Customer Active Carts and Pending Slot Reservations)
mongosh "<MONGODB_URI>" --file back-end/database/seed/seed-layer4.js
```

> **Note on Windows PowerShell:**
> You can also run the seed scripts directly using backslashes:
>
> ```powershell
> mongosh "<MONGODB_URI>" --file .\back-end\database\seed\seed-users.js
> mongosh "<MONGODB_URI>" --file .\back-end\database\seed\seed-catalog.js
> mongosh "<MONGODB_URI>" --file .\back-end\database\seed\seed-layer2.js
> mongosh "<MONGODB_URI>" --file .\back-end\database\seed\seed-layer3.js
> mongosh "<MONGODB_URI>" --file .\back-end\database\seed\seed-layer4.js
> ```

---

## 4. Step-by-Step Execution Procedure

### Step 1: Install Backend Dependencies

Open a terminal in the project root:

```bash
cd back-end

# Using Bun (Fastest)
bun install

# OR using npm / pnpm
npm install
```

### Step 2: Start the Backend Server

```bash
# Development mode with hot-reloading
bun run start:dev

# OR using npm
npm run start:dev
```

The backend server will start on `http://localhost:3000`.

- **Health Check**: Visit `http://localhost:3000/` in your browser.
- **Interactive Swagger API Docs**: Visit `http://localhost:3000/docs` or `http://localhost:3000/api/docs`.

---

### Step 3: Install Frontend Dependencies

Open a second terminal window:

```bash
cd react-frontend

# Using Bun
bun install

# OR using npm / pnpm
npm install
```

### Step 4: Start the Frontend Application

```bash
# Start Vite development server
bun run dev

# OR using npm
npm run dev
```

The React development server will start at:

- **Local URL**: `http://localhost:5173/`

---

### Step 5: Running Tests (Backend)

To verify database validations, auth guards, RBAC, and booking workflows:

```bash
cd back-end

# Run unit and workflow tests
bun run test
# or npm run test

# Run test coverage report
npm run test:cov
```

---

## 5. Portal Navigation & Test Accounts

The platform includes dedicated dashboards for each role in the system. You can log in with any of the pre-seeded accounts below (or create new accounts via the Registration page at `/auth/register`):

| Role           | Name    | Email                 | Sample Access / Route                                             |
| :------------- | :------ | :-------------------- | :---------------------------------------------------------------- |
| **Customer**   | Olivia  | `olivia@customer.com` | `/customer` (Service browsing, cart checkout, bookings)           |
| **Customer**   | Emily   | `emily@customer.com`  | `/customer` (Bookings, schedule management)                       |
| **Provider**   | David   | `david@provider.com`  | `/provider` (Job calendar, accept/decline offers, status updates) |
| **Provider**   | James   | `james@provider.com`  | `/provider` (Assigned jobs, active work status)                   |
| **Manager**    | Michael | `michael@manager.com` | `/manager` (Regional collective oversight, provider allocations)  |
| **Manager**    | Sarah   | `sarah@manager.com`   | `/manager` (Regional unit management)                             |
| **Super User** | John    | `john@admin.com`      | `/superuser` (Platform settings, commission split, global audit)  |

### Key Web Routes:

- **Landing Page**: `http://localhost:5173/`
- **Service Catalog**: `http://localhost:5173/services`
- **Service Details**: `http://localhost:5173/services/:serviceId`
- **Customer Portal**: `http://localhost:5173/customer`
- **Provider Portal**: `http://localhost:5173/provider`
- **Manager Portal**: `http://localhost:5173/manager`
- **SuperUser Portal**: `http://localhost:5173/superuser`
- **Login**: `http://localhost:5173/auth/login`
- **Register**: `http://localhost:5173/auth/register`

---

## 6. Team Contributions

### Team Information

- **Team**: 20_TatkuUnited
- **Course**: Full Stack Development (FSD), IIIT Sri City
- **Project**: Digital Marketplace for Non-Retail Services (On-Demand Service Scheduling & Fulfillment System)

---

### 1. R Shri Charan — Team Lead

- **Roll Number**: `S20240010196`
- **Role**: Team Lead / Full-Stack & System Architect

#### Key Contributions:

- Backend: While developing the react project, I noticed that the backend
  was messed up due to poor management last semester. So, I completely
  redesigned the backend.

- Database: I designed the database schema which is NoSQL based. I migrated
  from inconsistent mock data to consistent MongoDB database.

- React: I mainly contributed towards implementing the Auth system in the
  frontend, as well as the login and register pages. I also implemented
  service discovery and service details page. I implemented the customer
  service booking workflow and provider job assignment logic.
  I utilized the Shadcn (industry leading) UI library for polished
  components like toast, caurosel, card, item, button, spinner, etc.

#### I worked on:

1. Login page - LoginPage.tsx
2. Register page - RegisterPage.tsx
3. Auth services (login, register, logout) - authService.ts
4. Api service (axios) to make api calls simple - apiService.ts
5. Auth custom hook - useAuth.ts
6. Used Shadcn UI library
7. Worked on Customer service booking workflow - Customer and provider pages
8. Services for easing communication with backend - services/\*
9. Auth context api - AuthContext.ts
10. Service catalog - ServiceCatalog.tsx
11. Service details - ServicePage.tsx
12. Routing logic - App.tsx
13. Backend endpoint map - endpoints.ts
14. Http and roles enum
15. Protected route guard - protectedRoute.tsx
16. Error pages - notFound.tsx and forbiddenAccess.tsx

#### Files Worked On:

- **Authentication & Forms**:
  - `react-frontend/src/pages/general/LoginPage.tsx`
  - `react-frontend/src/pages/general/RegisterPage.tsx`
  - `react-frontend/src/common/services/authService.ts`
  - `react-frontend/src/common/AuthContext.ts`
  - `react-frontend/src/hooks/useAuth.ts`
- **API & Networking**:
  - `react-frontend/src/services/apiService.ts`
  - `react-frontend/src/common/endpoints.ts`
  - `react-frontend/src/common/http.methods.ts`
  - `react-frontend/src/common/roles.ts`
  - `react-frontend/src/common/services/*`
- **Catalog & Services**:
  - `react-frontend/src/pages/general/serviceCatalog.tsx`
  - `react-frontend/src/pages/general/servicePage.tsx`
- **Workflows & Routing**:
  - `react-frontend/src/App.tsx`
  - Customer booking and provider assignment workflow pages
- **Backend & Database**:
  - `back-end/src/` (Core NestJS modules, auth, users, providers, bookings, logging)
  - `back-end/database/seed/` (Database seed scripts & schemas)

---

### 2. Vasudev

- **Roll Number**: S20240010252
- **Role**: Team Member

#### Key Contributions:

- **Frontend Contributions**:
  - _Developed the superuser dashboard and management interfaces for users, categories, regions, services, and platform settings; added the superuser layout and routes, the DataTable and SummaryCards components, the landing page, and the shared sidebar._
- **Backend Contributions**:
  - _Contributed to the upload endpoint implementation with the help of AI._

#### Files Worked On:

- react-frontend/src/pages/superuser/dashboard.tsx
  react-frontend/src/pages/superuser/manage_users.tsx
  react-frontend/src/pages/superuser/manage_categories.tsx
  react-frontend/src/pages/superuser/manage_regions.tsx
  react-frontend/src/pages/superuser/manage_services.tsx
  react-frontend/src/pages/superuser/platform_settings.tsx
  react-frontend/src/pages/superuser/superuser_layout.tsx
  react-frontend/src/pages/superuser/superuser_route.tsx
  react-frontend/src/components/superuser/DataTable.tsx
  react-frontend/src/components/superuser/SummaryCards.tsx
  react-frontend/src/pages/general/landing/LandingPage.tsx
  react-frontend/src/pages/shared/Sidebar.tsx
  back-end/src/upload/upload.controller.ts

---

### 3. Prajwal

**Roll Number**: `S20240010079`

- **Role**: Provider Application / Frontend Integration

#### Key Contributions:

- Worked on the provider pages using the existing React frontend and NestJS APIs.
- Added provider routes and connected them to the shared sidebar.
- Connected provider pages to the authenticated user and provider data.
- Added assigned jobs, calendar, earnings, settings, and profile pages.
- Added the customer and provider service completion confirmation flow.

#### Frontend Contributions:

- Developed [`AssignedJobs.tsx`](./pages/provider/AssignedJobs.tsx) with provider booking retrieval, job statuses, `Start job`, `Mark completed`, and `Awaiting customer` actions.
- Developed [`JobCalender.tsx`](./pages/provider/JobCalender.tsx) with month navigation, date-specific jobs, unavailability records, job details, and add/edit unavailability actions.
- Updated [`Revenue.tsx`](./pages/provider/Revenue.tsx) to calculate provider earnings from completed bookings.
- Used the existing revenue split fields to show provider earnings and total revenue.
- Developed [`Settings.tsx`](./pages/provider/Settings.tsx) for editing provider experience, working hours, and working days.
- Developed [`Profile.tsx`](./pages/provider/Profile.tsx) for editing provider name, email, phone, gender, and date of birth.
- Reused existing UI components for the provider pages.
- Fixed customer booking navigation so customer booking links correctly use `/customer/bookings`.

#### Backend Contributions:

- Added the `completion_requested` booking status to support provider-requested completion confirmation.
- Added provider/customer booking completion endpoints:
  - `POST /bookings/:id/request-completion`
  - `POST /bookings/:id/confirm-completion`
  - `POST /bookings/:id/reject-completion`
- Added status-transition checks for the completion flow.
- Added frontend booking service helpers and endpoint constants for the new completion APIs.

#### Testing & Documentation:

- Tested the customer booking, job assignment, revenue, unavailability, and completion workflows.
- Reviewed the backend APIs before connecting the frontend pages.

#### Files Worked On:

- _[Placeholder: Add links to files worked on, e.g. `react-frontend/src/...` or `back-end/src/...`]_

---

### 4. Sambhav

- **Roll Number**: _[To be filled]_
- **Role**: Team Member

#### Key Contributions:

- **Frontend Contributions**:
  - _[Placeholder: Describe frontend components, user interfaces, or features developed]_
- **Backend Contributions**:
  - _[Placeholder: Describe backend endpoints, controllers, or business logic developed]_
- **Testing & Documentation**:
  - _[Placeholder: Describe unit tests, integration tests, or API documentation authored]_

#### Files Worked On:

- _[Placeholder: Add links to files worked on, e.g. `react-frontend/src/...` or `back-end/src/...`]_

---

### 5. Warshith

- **Roll Number**: _[To be filled]_
- **Role**: Team Member

#### Key Contributions:

- **Frontend Contributions**:
  - _[Placeholder: Describe frontend components, user interfaces, or features developed]_
- **Backend Contributions**:
  - _[Placeholder: Describe backend endpoints, controllers, or business logic developed]_
- **Testing & Documentation**:
  - _[Placeholder: Describe unit tests, integration tests, or API documentation authored]_

#### Files Worked On:

- _[Placeholder: Add links to files worked on, e.g. `react-frontend/src/...` or `back-end/src/...`]_
