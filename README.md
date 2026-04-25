# Digital Marketplace for Non-Retail Services  
## Problem Statement : On-Demand Service Scheduling & Fulfillment System

---

## 1. Project Overview

This project is a **Digital Marketplace for Non-Retail Services** focused on solving everyday service needs through a **reliable, low-cost, and system-driven fulfillment model**.

The platform connects customers with service providers for essential services such as repairs, maintenance, and routine assistance. At its core lies an **On-Demand Service Scheduling and Fulfillment System**, which takes full responsibility for scheduling, provider assignment, execution tracking, and failure recovery.

Unlike retail or e-commerce platforms, this system operates in the **service domain**, where fulfillment correctness depends on **time, skills, availability, and execution reliability**.

---

## 2. Domain Context

### Digital Marketplace for Services (Non-Retail)

- Services are intangible and time-bound  
- Fulfillment failures directly impact trust  
- Scheduling and execution are as important as booking  

The **bottom segment of the platform** is a **full-settlement fulfillment engine**, responsible for:
- Slot generation and validation  
- Provider discovery and assignment  
- Execution tracking  
- Failure detection and recovery  

---

## 3. Problem Being Addressed

In middle-class and low-income households — and in small and medium-sized businesses — everyday service issues often take **days to resolve** due to:

- Unorganized service discovery  
- Manual coordination with providers  
- Lack of scheduling guarantees  
- High service costs  
- No accountability after booking  

Existing platforms such as Urban Company primarily cater to **middle- and high-income households**, leaving a large, price-sensitive segment underserved.

---

## 4. Target Audience 

### Primary Users
- Middle-class households  
- Low-income households  
- Small and medium-sized businesses  

### Core Need
> Affordable, reliable, and quick resolution of daily service issues.

The platform is designed to ensure that **solving everyday nuances is just a click away**, without premium pricing or long delays.

---

## 5. How This Differs from Urban Company

### Customer Experience
- Similar to Urban Company  
- Simple booking, slot selection, and confirmation  

### Provider Experience (Key Difference)
- Inspired by **unions / collectives**
- Providers operate as part of a **collective workforce**
- Fulfilment is **not competitive bidding**
- No accept/reject flow for jobs  

The system owns the responsibility of fulfillment.

---

## 6. Collective Model

The platform adopts a **Collective Fulfillment Model**, inspired by real-world labor unions, especially in semi-urban and rural contexts.

### Key Characteristics

- The platform **leverages pre-existing collectives and enables creation of new ones too.**  
- Individual service providers have a choice of joining a nearby collective or operating on their own.
- Collectives are already organized based on:
  - Region  
  - Skill sets  
- The platform provides a **shared work calendar** for the service providers of a collective for better schedule and time management.
- A designated **Collective Manager** is responsible for coordination and operational oversight within the collective.

### Why This Model?

- Collectives already exist and function effectively  
- Enables fair work distribution with adopting the concept of income pooling to support healthy benefits such as health, education and skill development.
- Supports skill growth (senior providers train junior ones).
- Makes the platform viable in semi-urban and rural regions.

> Customers interact with the **platform**, not individual providers.

---

## 7. Service Booking Models Supported

The platform supports three booking types:

### 1. Instant Service
- Immediate service request  
- System assigns nearest eligible provider  

### 2. Scheduled One-Time Service
- Customer selects a future slot  
- Slot is system-generated and validated  

### 3. Recurring Service (Weekly / Monthly)
- Customer schedules repeated services  
- System ensures:
  - Slot continuity
  - Provider consistency where possible
  - Automatic reassignment when required  

> Recurring services feature is not implemented as of now, the system would require much complex modifications and logic to implement it. Currently, we are only focusing on One Time Booking Model and Instant Booking Model.
---

## 8. Identified Actors

1. **Customer**: End-users who browse services, book jobs, and provide feedback.
2. **Service Provider**: Skilled professionals who execute the assigned services.
3. **Unit Manager**: Oversees a specific skill-based unit (e.g., Electrical, Plumbing) within a collective.
4. **Collective Manager**: Manages an entire collective, coordinating across multiple units and sectors.
5. **Super User**: Platform administrators responsible for global settings and oversight.

Fulfillment logic, scheduling algorithms, delivery coordination, and administrative controls are **internal system responsibilities**.

---

## 9. Features for Actors

### Customer
- Book instant or scheduled services (Cart and Checkout flow).
- Make secure payments.
- Receive provider and schedule notifications.
- Track service execution.
- Submit feedback and ratings per completed service.

---

### Service Provider
- Manage profile, skills, and availability (including recurring unavailability).
- View assigned jobs via work calendar.
- Receive system-assigned jobs (no accept/reject).
- Update job assignment status.
- Complete jobs and track earnings.

---

### Unit & Collective Managers
- **Unit Manager**: Oversee unit-level provider performance, manage unit-specific schedules, and handle disputes.
- **Collective Manager**: Oversee collective-level operations, manage units, and ensure regional fulfillment efficiency.

---

### Super User
- Manage platform-wide settings.
- Oversee all users, transactions, and revenue ledgers.

---

## 10. Tech Stack & Architecture

### Front-End
- **Technology**: Vanilla HTML5, CSS3, and JavaScript.
- **Architecture**: Modular structure with dedicated portal pages for each actor (`customer`, `provider`, `unit_manager`, `collective_manager`, `super_user`, `auth_pages`, and `service_pages`).
- **State Management**: Centralized data stores and utilities (`js/data/`, `js/utils/`) managing session and UI state.

### Back-End
- **Framework**: NestJS (TypeScript).
- **Data Layer (`database.service.ts`)**: Currently utilizes a comprehensive in-memory datastore simulating a relational database with seeded data. It covers complex relationships across:
  - **Users & Orgs**: Customers, ServiceProviders, Managers (Unit/Collective), SuperUsers, Collectives, Units, Sectors.
  - **Catalog**: Categories, Services, Skills, ServiceContent, ServiceFaq.
  - **Fulfillment**: Carts, Bookings, JobAssignments (one per service in a booking), ProviderUnavailability.
  - **Financials**: Transactions and RevenueLedgers (managing payout splits between SP, Unit Manager, Collective Manager, and Platform).
  - **Feedback**: Post-job Reviews.

---

## 11. Core System Responsibilities (Internal)

### Scheduling & Fulfillment
- Attach required skills to service packages  
- Discover eligible providers by skill, location, and availability  
- Use **weighted scheduling** (ratings + recency + workload)  
- Avoid pure round-robin and pure first-come-first-serve  

### Assignment Logic
- Fanout-based provider evaluation  
- Deterministic provider ranking  
- System-driven assignment with assignment locking  

---

### Failure Handling & Exceptions

- Detect provider no-shows and delays  
- Attempt automatic reassignment  
- Escalate unresolved cases for human intervention  

> Not all edge cases can be solved by code alone.

---

## 12. Current Focus of the Project

At the **current (preliminary) stage**, the project is focused on:

- Scheduling algorithms  
- Fulfillment correctness  
- Recurring service logic  
- Failure and recovery handling  
- Implementation of comprehensive actor portals (Front-end)
- Data modeling for complete service fulfillment lifecycle (Back-end)

UI polish, business expansion, and advanced ML-based optimizations are out of scope for now.

---

## 13. Project Scope

### In Scope
- On-demand scheduling logic  
- Provider discovery and assignment  
- Collective-based fulfillment  
- Failure detection and recovery  
- Multi-actor portal interfaces

### Out of Scope (Currently)
- Legal and policy compliance automation  
- Advanced ML-based optimization  
- Large-scale microservice decomposition  

---

## 13. Conclusion

This project models a **realistic, system-driven service marketplace** where fulfillment is treated as a **first-class responsibility**, not an operational afterthought.

By combining:
- Intelligent scheduling  
- Collective-based provider organization  
- System-owned accountability  

the platform aims to deliver **Urban Company–like reliability** to **underserved segments**, at lower cost and higher accessibility.
