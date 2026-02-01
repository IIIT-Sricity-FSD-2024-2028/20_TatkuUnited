# Summary of the interaction
## Basic information
    Domain: Digital Marketplace for Services (Non-Retail)
    Problem statement: On-Demand Service Scheduling and Fulfillment System
    Date of interaction: 30th Jan 2026
    Mode of interaction: Video call
    Duration (in-minutes): 47 min
    Publicly accessible Video link: https://drive.google.com/file/d/1O4z_dL_rCN1q1zkA0fzaKNp5JvnNuzBU/view?usp=sharing
## Domain Expert Details
    Role/ designation (Do not include personal or sensitive information): Software Engineer – Backend & Machine Learning
    Experience in the domain (Brief description of responsibilities and years of experience in domain):
    B.Tech (IT) graduate from IIIT Allahabad with industry experience as Software Engineer–I at Urban Company and prior internships in AI-driven and product-based startups. Experienced in building and optimizing scalable backend systems, working on high-throughput services, database performance optimization, and applied machine learning. Has hands-on experience in NLP, semantic search, distributed systems, and production-grade APIs, with measurable improvements in system latency and performance. Strong background in data structures and algorithms and competitive programming
    Nature of work: Developer
## Domain Context and Terminology
- How would you describe the overall purpose of this problem statement in your daily work?
## Overall Purpose of the Problem Statement (Daily Work Perspective)

The overall purpose of the **On-Demand Service Scheduling and Fulfillment System** in daily work is to systematically manage and control how service requests are **scheduled, assigned, and executed** in a reliable and structured manner.

On a day-to-day basis, this problem statement guides the work toward:

- Converting informal service coordination into a well-defined workflow  
- Ensuring that service requests move smoothly from booking to completion  
- Reducing uncertainty, delays, and manual follow-ups  
- Providing operational clarity for both customers and service providers  

In essence, the purpose is to bring **predictability, accountability, and structure** to everyday service interactions that are otherwise fragmented and unreliable.

---

## What are the primary goals or outcomes of this problem statement?

### Primary Goals

### 1. Reliable On-Demand Service Scheduling

The primary goal is to enable customers to schedule services in a **predictable, time-bound, and system-enforced** manner.

Customers must be able to:
- Select a service  
- Choose a date and time slot  
- Receive confirmation without repeated follow-ups  

Scheduling eliminates:
- Uncertain availability  
- Verbal commitments  
- Delays caused by no-shows  

**Justification (Scheduling):**  
Scheduling transforms informal, unreliable service coordination into a **structured, time-guaranteed interaction** between customers and service providers.

---

### 2. End-to-End Service Fulfillment Assurance

The system ensures that every scheduled service is **actually delivered**, not just booked.

Fulfillment includes:
- Assigning an appropriate service provider  
- Ensuring the provider arrives at the scheduled time  
- Completing the service within the defined scope  

The platform tracks the entire service lifecycle:

Requested → Scheduled → Assigned → In-Progress → Completed


**Justification (Fulfillment):**  
Fulfillment bridges the gap between **booking a service and receiving the service**, ensuring real-world execution rather than just digital confirmation.

---

### 3. Reduction of Coordination Overhead for Customers

A key outcome is to remove the burden of:
- Calling multiple service contacts  
- Negotiating availability  
- Repeated follow-ups and uncertainty  

The platform acts as a **single point of resolution** for diverse household and small-business service needs.

---

### 4. Support for Both One-Time and Recurring Services

The system must support:
- One-time services (repairs, installations)  
- Recurring services (gardening, maintenance, cleaning)  

This ensures:
- Continuity of service  
- Fixed schedules  
- Reduced anxiety for customers during long-term needs (e.g., travel, daily upkeep)

---

### 5. Transparent Pricing and Service Scope

The system provides:
- Upfront pricing  
- Clearly defined service scope  

This removes:
- Last-minute bargaining  
- Disputes after service completion  

Transparency is essential for **trust and repeat usage**.

---

## Secondary Goals  
*(Supporting but not core to the problem statement)*

### 6. Improved Service Reliability Through Provider Structuring

Service providers are organized through **collectives** to:
- Ensure backup availability  
- Maintain accountability  

This indirectly improves fulfillment reliability for customers.

---

### 7. Stable Workflows for Service Providers

Structured scheduling enables:
- Predictable workloads  
- Stable income through recurring services  

Provider reliability directly enhances customer fulfillment success.

---

### 8. Quality Improvement Over Time

Feedback and collective learning allow:
- Upskilling of service providers  
- Improved service consistency  

This strengthens long-term platform trust.

- List key terms used by the domain expert and their meanings (Copy these to definition.yml)

| Term                   | Meaning as explained by the expert                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Checkout Screen        | The final step in the booking flow where the customer reviews the selected service and completes payment to confirm the booking.       |
| Fulfillment Team       | An internal operations team responsible for assigning jobs to service providers and ensuring that services are executed successfully.  |
| Catalog Team           | An internal team that manages service listings, service categories, and the structure of services offered on the platform.             |
| Delivery Team          | A team responsible for overseeing the on-ground execution and completion of services delivered to customers.                           |
| Skill                  | A specific capability or competency required by a service provider to perform a service.                                               |
| Provider               | A service professional who delivers services assigned by the fulfillment team.                                                         |
| Category               | A grouping of services based on the type or domain of service offered.                                                                 |
| Skill-Based Clustering | The process of grouping service providers based on their skills to enable efficient job assignment.                                    |
| Skill Package          | A predefined set of skills attached to a service provider by the fulfillment team to determine the types of jobs they can be assigned. |
| Direct Job Assignment  | A process where the fulfillment team assigns jobs directly to providers without allowing providers to accept or reject the job.        |

Some of the terms the domain expert has mentioned are used in the company level. We haven't adopted some of those terms in the project yet because,the domain expert told, it is not advisable to adopt that company level terminology at this stage of project. 

## Actors and Responsibilities
- Identify the different roles involved and what they do in practice.

| Actor / Role | Responsibilities |
|---|---|
| Customer |  | 
| Service Provider |  | 
| 

## Core workflows
Description of at least 2-3 real workflows as explained by the domain expert
## Workflow 1: Customer Service Booking & Checkout Workflow

### Trigger / Start Condition
- A new or existing user opens the app/website and selects a service category.

### Steps Involved (in order)
1. **NAR Team (User Acquisition & Maintenance)**
   - Ensures the user is onboarded, authenticated, and tracked.

2. **Category Selection**
   - User clicks on a service category (e.g., AC repair, lighting, network).

3. **Catalogue Page (Catalogue Team)**
   - User is redirected to the catalogue/cart page.
   - User browses and selects one or more services.

4. **Checkout Page (Fulfillment Team)**
   - User is redirected to checkout.
   - User selects a preferred service slot (date & time).
   - Slot selection is handled by the fulfillment system.

5. **Payment**
   - User completes payment for the selected services.

6. **Ownership Transition**
   - Onboarding and catalogue responsibilities end.
   - Fulfillment responsibility continues for provider assignment.

### Outcome / End Condition
- Service booking is confirmed with selected services, confirmed slot, and successful payment.
- System is ready to initiate service provider allocation.


---

## Workflow 2: Service Provider Search & Assignment (Fulfillment Workflow)

### Trigger / Start Condition
- A customer completes checkout and payment for a service.

### Steps Involved (in order)
1. **Service Request Creation**
   - Backend creates a service request with service type, location, slot, and customer details.

2. **Provider Search Query**
   - Fulfillment system triggers a search for eligible service providers.

3. **Fanout Architecture**
   - Request is fanned out to service providers matching skill, location, and availability.

4. **Scheduling Constraints Validation**
   - Interval overlap and availability window checks are applied.
   - First-come-first-serve logic is avoided.

5. **Provider Prioritization**
   - Providers are ranked based on ratings, past user experience, and reliability.

6. **Automatic Provider Assignment**
   - Job is assigned to the highest-ranked eligible provider.
   - Providers do not accept or reject jobs; assignment is system-driven.

### Outcome / End Condition
- A suitable service provider is assigned and the job is locked for execution.


---

## Workflow 3: Service Execution, Monitoring & Incentivization Workflow

### Trigger / Start Condition
- A service provider is assigned to a confirmed service booking.

### Steps Involved (in order)
1. **Delivery Team Takeover**
   - Delivery team ensures the assigned provider reaches the customer on time.

2. **Service Execution**
   - Service provider performs the service at the scheduled time.

3. **Journey Monitoring**
   - Journey team tracks user behavior, delays, and friction points across the flow.

4. **Service Completion**
   - Service is marked as completed in the system.

5. **Customer Feedback Collection**
   - Customer submits ratings and reviews for the service provider.

6. **Incentive & Quality Feedback Loop**
   - Provider incentives and future assignment priority are adjusted based on user experience.

### Outcome / End Condition
- Service is successfully delivered and closed.
- Feedback improves future scheduling, fulfillment, and provider performance.


## Rules, Constraints, and Exceptions
Document rules that govern how the domain operates.
  - Mandatory rules or policies: 
  - Constraints or limitations:
  - Common exceptions or edge cases:
  - Situations where things usually go wrong:
## Current challenges and pain points
- What parts of this process are most difficult or inefficient? 
- Where do delays, errors, or misunderstandings usually occur?
- What information is hardest to track or manage today?
 ## Assumptions & Clarifications
- What assumptions made by the team that were confirmed
- What assumptions that were corrected 
- Open questions that need follow-up 


DomainExpertInteraction.md
Displaying DomainExpertInteraction.md.