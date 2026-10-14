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

| Role | Name | Email | Sample Access / Route |
| :--- | :--- | :--- | :--- |
| **Customer** | Olivia | `olivia@customer.com` | `/customer` (Service browsing, cart checkout, bookings) |
| **Customer** | Emily | `emily@customer.com` | `/customer` (Bookings, schedule management) |
| **Provider** | David | `david@provider.com` | `/provider` (Job calendar, accept/decline offers, status updates) |
| **Provider** | James | `james@provider.com` | `/provider` (Assigned jobs, active work status) |
| **Manager** | Michael | `michael@manager.com` | `/manager` (Regional collective oversight, provider allocations) |
| **Manager** | Sarah | `sarah@manager.com` | `/manager` (Regional unit management) |
| **Super User** | John | `john@admin.com` | `/superuser` (Platform settings, commission split, global audit) |

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
1. **Backend Architecture Redesign**:
   - Re-architected and modernized the entire backend from legacy prototypes into an enterprise-grade NestJS modular system.
   - Designed clean dependency injection hierarchies across controllers, services, guards, interceptors, and DTOs.
   - Built the centralized HTTP exception handling (`AllExceptionsFilter`), request correlation tracking with `X-Request-Id`, and Winston rotating file logging.

2. **NoSQL Database Architecture & Migration**:
   - Designed the complete normalized NoSQL schema in MongoDB with cross-collection relationships (Users, Providers, Managers, Regions, Categories, Services, Orders, Bookings, Payments, Reviews).
   - Migrated the application from inconsistent mock datasets to a robust MongoDB database with multi-document ACID transactions and schema validations.
   - Authored comprehensive database documentation and multi-tiered seed workflows.

3. **Authentication & Authorization System**:
   - Built end-to-end authentication infrastructure on the frontend and backend.
   - Developed the React Auth Context (`AuthContext.ts`), custom `useAuth.ts` hook, and secure session management.
   - Implemented JWT token handling, login flow, register flow, and logout workflows.

4. **Service Discovery & Catalog**:
   - Implemented dynamic service catalog browsing with real-time category filtering.
   - Created individual service details pages featuring pricing, duration, included coverage, FAQs, and ratings.

5. **Customer Booking & Provider Workflow**:
   - Designed and built the customer service booking workflow (cart management, address selection, scheduling, and checkout).
   - Built provider job assignment logic, real-time incoming offer response, and status updates.

6. **Frontend Infrastructure & UI Integration**:
   - Integrated Shadcn UI component library and Tailwind CSS styling system.
   - Developed centralized API caller (`apiService.ts` with Axios interceptors for bearer tokens and error normalization).
   - Structured routing logic (`App.tsx`), backend endpoint map (`endpoints.ts`), HTTP methods enum, and Role-Based definitions.

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
- **Roll Number**: *[To be filled]*
- **Role**: Team Member

#### Key Contributions:
- **Frontend Contributions**:
  - *[Placeholder: Describe frontend components, user interfaces, or features developed]*
- **Backend Contributions**:
  - *[Placeholder: Describe backend endpoints, controllers, or business logic developed]*
- **Testing & Documentation**:
  - *[Placeholder: Describe unit tests, integration tests, or API documentation authored]*

#### Files Worked On:
- *[Placeholder: Add links to files worked on, e.g. `react-frontend/src/...` or `back-end/src/...`]*

---

### 3. Prajwal
- **Roll Number**: *[To be filled]*
- **Role**: Team Member

#### Key Contributions:
- **Frontend Contributions**:
  - *[Placeholder: Describe frontend components, user interfaces, or features developed]*
- **Backend Contributions**:
  - *[Placeholder: Describe backend endpoints, controllers, or business logic developed]*
- **Testing & Documentation**:
  - *[Placeholder: Describe unit tests, integration tests, or API documentation authored]*

#### Files Worked On:
- *[Placeholder: Add links to files worked on, e.g. `react-frontend/src/...` or `back-end/src/...`]*

---

### 4. Sambhav
- **Roll Number**: *[To be filled]*
- **Role**: Team Member

#### Key Contributions:
- **Frontend Contributions**:
  - *[Placeholder: Describe frontend components, user interfaces, or features developed]*
- **Backend Contributions**:
  - *[Placeholder: Describe backend endpoints, controllers, or business logic developed]*
- **Testing & Documentation**:
  - *[Placeholder: Describe unit tests, integration tests, or API documentation authored]*

#### Files Worked On:
- *[Placeholder: Add links to files worked on, e.g. `react-frontend/src/...` or `back-end/src/...`]*

---

### 5. Warshith
- **Roll Number**: *[To be filled]*
- **Role**: Team Member

#### Key Contributions:
- **Frontend Contributions**:
  - *[Placeholder: Describe frontend components, user interfaces, or features developed]*
- **Backend Contributions**:
  - *[Placeholder: Describe backend endpoints, controllers, or business logic developed]*
- **Testing & Documentation**:
  - *[Placeholder: Describe unit tests, integration tests, or API documentation authored]*

#### Files Worked On:
- *[Placeholder: Add links to files worked on, e.g. `react-frontend/src/...` or `back-end/src/...`]*
