**Roll Number**: `S20240010196`
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

- `react-frontend/src/pages/provider/AssignedJobs.tsx`
- `react-frontend/src/pages/provider/JobCalender.tsx`
- `react-frontend/src/pages/provider/Revenue.tsx`
- `react-frontend/src/pages/provider/Settings.tsx`
- `react-frontend/src/pages/provider/Profile.tsx`
- `react-frontend/src/pages/provider/provider_layout.tsx`
- `react-frontend/src/pages/provider/provider_route.tsx`
- `react-frontend/src/pages/customer/BookingHistoryPage.tsx`
- `react-frontend/src/pages/customer/CustomerDashboard.tsx`
- `react-frontend/src/pages/customer/RatingsFeedbackPage.tsx`
- `react-frontend/src/pages/PublicNavbar.tsx`
- `react-frontend/src/services/bookings.service.ts`
- `react-frontend/src/common/endpoints.ts`
- `react-frontend/src/models/api.models.ts`
- `back-end/src/bookings/bookings.controller.ts`
- `back-end/src/bookings/bookings.service.ts`
- `back-end/src/common/enums/booking-status.enum.ts`
- `back-end/docs/swagger.json`
