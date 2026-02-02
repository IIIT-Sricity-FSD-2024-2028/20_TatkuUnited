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

## 4. Target Audience (Key Differentiator)

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
- Scheduling is **not competitive bidding**
- No accept/reject flow for jobs  

The system owns the responsibility of fulfillment.

---

## 6. Collective (Union-Inspired) Model

The platform adopts a **Collective Fulfillment Model**, inspired by real-world labor unions, especially in semi-urban and rural contexts.

### Key Characteristics

- The platform **leverages pre-existing provider collectives** rather than creating or restructuring them  
- Individual providers are **not onboarded independently**; all providers operate **through their respective collectives**  
- Collectives are already organized based on:
  - Region  
  - Skill sets  
- Each collective operates a **shared work calendar** for its providers  
- A designated **Collective Manager** is responsible for coordination and operational oversight within the collective  

### Why This Model?

- Collectives already exist and function effectively  
- Enables fair work distribution without income pooling  
- Supports skill growth (senior providers train junior ones)  
- Makes the platform viable in semi-urban and rural regions  

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

> Recurring services are treated as a **core design challenge**, not an add-on.

---

## 8. Identified External Actors

1. **Customer**
2. **Service Provider**
3. **Manager (Collective Manager)**

Fulfillment logic, scheduling algorithms, delivery coordination, and administrative controls are **internal system responsibilities**.

---

## 9. Planned Features by Actor

### Customer
- Book instant, scheduled, or recurring services  
- Select system-generated slots  
- Make secure payments  
- Receive provider and schedule notifications  
- Track service execution  
- Submit feedback and ratings  

---

### Service Provider
- Manage profile and availability  
- View assigned jobs via work calendar  
- Receive system-assigned jobs (no accept/reject)  
- Update service status  
- Complete jobs using OTP-based verification  

---

### Manager (Collective Manager)
- Oversee collective-level scheduling  
- Handle exceptional cases (disputes, no-shows)  
- Monitor provider performance  
- Support training and skill development  

---

## 10. Core System Responsibilities (Internal)

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

## 11. Current Focus of the Project

At the **current (preliminary) stage**, the project is focused on:

- Scheduling algorithms  
- Fulfillment correctness  
- Recurring service logic  
- Failure and recovery handling  

UI polish, business expansion, and advanced ML-based optimizations are out of scope for now.

---

## 12. Project Scope

### In Scope
- On-demand scheduling logic  
- Provider discovery and assignment  
- Collective-based fulfillment  
- Failure detection and recovery  

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
