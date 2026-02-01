# Summary of the interaction
## Basic information
### Domain: Digital Marketplace for Services (Non-Retail)
- Problem statement: On-Demand Service Scheduling and Fulfillment System
- Date of interaction: 30th Jan 2026
-  Mode of interaction: Video call
- Duration (in-minutes): 47 min
- Publicly accessible Video link: https://drive.google.com/file/d/1O4z_dL_rCN1q1zkA0fzaKNp5JvnNuzBU/view?usp=sharing
## Domain Expert Details
### Role/ designation 
- Software Development Engineer – Backend & Machine Learning
### Experience in the domain :
- B.Tech (IT) graduate from IIIT Allahabad with industry experience as Software Engineer–I at Urban Company and prior internships in AI-driven and product-based startups. Experienced in building and optimizing scalable backend systems, working on high-throughput services, database performance optimization, and applied machine learning. Has hands-on experience in NLP, semantic search, distributed systems, and production-grade APIs, with measurable improvements in system latency and performance. Strong background in data structures and algorithms and competitive programming
### Nature of work
- Developer
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

| Actor / Role | Responsibilities |
|---|---|
| **Customer** | - Browse service categories and select required services<br>- Choose preferred date and time slot for service delivery<br>- Complete payment for booked services<br>- Be available at the scheduled time and location<br>- Provide feedback and ratings after service completion |
| **Service Provider** | - Declare availability windows and serviceable areas<br>- Maintain required skills and service quality standards<br>- Accept system-assigned jobs within declared availability (no manual accept/reject)<br>- Reach the customer location on time and perform the service<br>- Update service status and comply with platform guidelines |
| **Manager** | - Oversee service categories, pricing, and service definitions<br>- Monitor provider performance, ratings, and reliability metrics<br>- Handle exceptions such as delays, cancellations, or disputes<br>- Manage service provider collectives and operational policies<br>- Ensure service quality and fulfillment SLAs are maintained |
| **System (Secondary Actor)** | - Manage service scheduling and slot availability<br>- Enforce scheduling constraints and prevent conflicts<br>- Match service requests with suitable service providers using fulfillment logic<br>- Track the end-to-end service lifecycle from booking to completion<br>- Collect data for monitoring, optimization, and incentive calculation |

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

This section outlines the governing rules, limitations, and exception scenarios for the on-demand service marketplace domain, based on the domain expert discussion.

---

### Mandatory Rules or Policies

- Service providers **must only be assigned services that match their registered skills**.
- **Scheduling and provider assignment are fully system-driven** and handled by the fulfillment logic.
- Service providers **cannot accept or reject jobs** once availability is declared.
- **Provider ratings must influence job prioritization** when multiple eligible providers exist.
- The system **must incentivize good customer experience** through higher priority and better job allocation.
- **Recurring services must follow consistent scheduling rules** throughout their lifecycle.
- After successful payment, the system **must proceed with fulfillment automatically**.

---

### Constraints or Limitations

- Providers can only be scheduled **within their declared availability windows**.
- Scheduling logic must balance **skills, ratings, availability, and fairness**, limiting the use of simple algorithms.
- **Not all scenarios can be handled through automation**; some require human intervention.
- Manual admin management **does not scale** for large numbers of users or providers.
- Post-service processes such as warranties and refunds **fall outside core pre-delivery system scope**.

---

### Common Exceptions or Edge Cases

- **Provider No-Show**: Provider fails to arrive at the scheduled time.
- **Customer Cancellation**: Customer cancels after scheduling, potentially near service time.
- **Recurring Service Disruption**: Provider becomes unavailable during an active recurring plan.
- **Low-Rated Provider Assignment**: Assigned when no higher-rated provider is available.
- **Scheduling Conflicts**: Overlapping or invalid slots generated by system logic.
- **Customer–Provider Mismatch**: Reassignment required due to prior negative experience.

---

### Situations Where Things Usually Go Wrong

- **Complex scheduling edge cases**, especially involving recurring plans.
- **Dispute handling**, where service quality cannot be fully validated by system logic.
- **Over-dependence on admin intervention**, causing operational bottlenecks.
- **Poor incentive structures**, such as equal job distribution regardless of performance.
- **Improper handling of cancellations and no-shows**, reducing platform trust.

---

### Key Takeaway

> The domain functions best when **scheduling is automated**, **quality is rewarded**, and **exceptions are supported by human intervention**.

## Current Challenges and Pain Points

### What parts of this process are most difficult or inefficient?

From a high-level design perspective, the overall flow of an on-demand service platform is conceptually clear. However, both industry practices and domain expert input indicate that the **most difficult and inefficient part of the process is service scheduling**.

Key challenges include:
- Handling different types of services with varying durations and complexity
- Supporting multiple scheduling options such as one-time and recurring services
- Coordinating multiple services booked in a single order
- Aligning customer-selected time slots with service provider availability, skills, and location
- Preventing time conflicts and overlapping service assignments

Scheduling directly impacts service fulfillment and therefore becomes the most critical and sensitive component of the system.

---

### Where do delays, errors, or misunderstandings usually occur?

Delays and errors typically occur in areas where **logical scheduling decisions must align with real-world constraints**:

- Slot availability mismatches between customer selection and actual provider availability
- Delays in assigning the most suitable service provider after booking
- Complex bookings involving multiple services or recurring schedules
- Expectation mismatches when customers assume immediate service without understanding operational constraints
- Last-mile execution issues, such as provider delays or overbooked schedules

According to the domain expert, such issues rarely originate from user-facing design but instead stem from **backend scheduling and provider allocation logic**.

---

### What information is hardest to track or manage today?

The most difficult information to track and manage in real time includes:

- Accurate and up-to-date service provider availability windows
- Variability in actual service durations compared to estimated times
- Mapping the right skill sets to the correct service requirements
- Ensuring consistency and reliability in recurring service assignments
- Managing scheduling constraints such as buffer times, interval overlaps, and capacity limits

The domain expert highlighted that **managing these scheduling variables at scale** is the primary operational challenge, rather than the high-level system architecture itself.

---

### Key Insight

> While the high-level system design is straightforward, the real challenge lies in implementing a robust and flexible scheduling mechanism that can handle diverse services, time options, and provider constraints while ensuring reliable fulfillment.
 ## Assumptions & Clarifications
## Assumptions & Clarifications

### 1. Assumptions Made by the Team and Confirmed

- **Separation of responsibilities across system components**  
  The assumption that the system can be logically divided into catalog, fulfillment (scheduling), delivery, and journey/orchestration layers was confirmed as an industry-aligned approach.

- **Fulfillment team owns scheduling logic**  
  Scheduling (slot allocation and provider assignment) is not part of catalog or checkout and is handled entirely by the fulfillment logic.

- **Skill-based provider assignment**  
  Services require specific skills, and providers must be matched based on those skills as a core industry principle.

- **Provider availability is time-based**  
  Providers declare availability windows, and the system schedules jobs strictly within those windows.

- **Ratings influence provider selection**  
  Higher-rated providers are preferred when multiple eligible providers are available for the same time slot.

- **Recurring services are valid and common**  
  Instant, one-time scheduled, and recurring (weekly/monthly) services are realistic and commonly used in production systems.

- **Automation-first system design**  
  Most scheduling, matching, and prioritization decisions are automated rather than manually controlled by admins.

---

### 2. Assumptions That Were Corrected

- **Providers can accept or reject jobs (Rapido-style model)**  
  *Corrected:* Providers do not accept or reject jobs. Once availability is declared, jobs are directly assigned by the system.

- **Equal job or income distribution among providers**  
  *Corrected:* Equal distribution removes incentives for quality. Provider differentiation (ratings, behavior, reliability) must influence assignment.

- **Admin manually manages users and providers**  
  *Corrected:* Users and providers manage their own profiles. Admin involvement is limited to exceptions or system-level failures.

- **All disputes can be handled by code**  
  *Corrected:* No-shows, disputes, and service conflicts often require human intervention and cannot be fully automated.

- **Round-robin scheduling is sufficient**  
  *Corrected:* Pure round-robin ignores service quality. A weighted approach considering ratings, recency, and availability is required.

---

### 3. Assumptions That Were Partially Validated / Clarified

- **Union / collective-based provider model**  
  Routing jobs through collectives or unions is feasible, but final assignment decisions should rest with the collective manager.

- **Weighted scheduling algorithms**  
  Exact algorithms were not specified, but scheduling must consider multiple weighted factors such as ratings, availability, fairness, and recency.

- **Admin role definition**  
  Admin roles exist conceptually but require clear boundaries; overloading admin responsibilities can hinder scalability.

---

### 4. Open Questions Requiring Follow-Up

- **Exact scheduling algorithm details**  
  What are the precise weights and decision rules among rating, distance, availability, recency, and fairness?

- **Legal and regulatory requirements**  
  Legal and compliance policies required for the platform were not discussed and need separate research.

- **Post-service processes**  
  Technical handling of warranties, refunds, and dispute resolution remains undefined.

- **Collective accountability model**  
  Rules for conflict handling, penalties, and quality enforcement within unions require further clarification.

- **Automation thresholds**  
  Criteria for automatically banning or restricting providers based on ratings or complaints need definition.

DomainExpertInteraction.md
Displaying DomainExpertInteraction.md.