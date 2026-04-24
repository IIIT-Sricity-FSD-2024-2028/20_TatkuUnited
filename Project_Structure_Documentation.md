# TatkuUnited Project Structure Documentation

## Overview

TatkuUnited is a web-based platform designed to connect service providers with customers, facilitating service discovery, booking, and management. The project appears to be a comprehensive application with multiple user roles including customers, service providers, unit managers, collective managers, and super users. The architecture includes a front-end web interface, a database backend, and supporting documentation and design files.

## Project Root Structure

The project is organized at the root level with the following components:

### Documentation Files

- **README.md**: Main project documentation, likely containing setup instructions, project overview, and usage guidelines.
- **definitions.yml**: YAML file containing project definitions, possibly API schemas, configuration settings, or data models.
- **DomainExpertInteraction.md**: Documentation of interactions with domain experts, possibly requirements gathering or design decisions.
- **Data_MockData_Revenue_Summary.md**: Mock data and revenue summary documentation for testing and planning purposes.
- **task-board.html**: HTML file serving as a task management board, possibly for project tracking.

### Database

- **Database/**: Contains database-related files
  - **DBschema.sql**: Main database schema definition
  - **tatku-db/**: Docker-based database setup
    - **docker-compose.yml**: Docker Compose configuration for database containerization
    - **README.md**: Database setup instructions
    - **init/**: Database initialization scripts
      - **01_init.sql**: Initial database setup script
      - **DBschema.sql**: Schema definition for initialization

### Design Assets

- **Figma Designs/**: UI/UX design files created in Figma
  - **Assigned Job Details.fig**: Design for job assignment details page
  - **Booking Confirmation Page.fig**: Design for booking confirmation
  - **Customer Dashboard.fig**: Customer's main dashboard design
  - **Landing page.fig**: Main landing page design
  - **Login Page.fig**: User login interface design
  - **Main.fig**: Primary design file (possibly containing multiple screens)
  - **Manage Skills Page.fig**: Interface for managing provider skills
  - **Manager Dashboard.fig**: Manager's dashboard design
  - **payments.fig**: Payment processing interface design
  - **Provider Dashboard.fig**: Service provider's dashboard design
  - **Register Page.fig**: User registration interface design
  - **reviewPage.fig**: Review and rating page design
  - **Service Discovery Page.fig**: Page for discovering available services
  - **Service, Category Detail Page.fig**: Detailed service and category information
  - **Work Calendar.fig**: Calendar interface for scheduling work

### Front-End Application

- **front-end/**: Complete front-end implementation organized by technology and user role
  - **css/**: Cascading Style Sheets organized by feature and user type
    - **customer_notifications.css**: Styling for customer notification components
    - **landing_page.css**: Styles for the main landing page
    - **auth_pages/**: Authentication-related styles
      - **login.css**: Login page styling
      - **logout.css**: Logout page styling
      - **register-success.css**: Registration success page styling
      - **register.css**: Registration form styling
    - **collective_manager/**: Styles for collective manager interfaces
      - **admit_providers.css**: Provider admission interface styling
      - **dashboard.css**: Collective manager dashboard styling
      - **manage_units.css**: Unit management interface styling
      - **notifications.css**: Notification components styling
      - **profile.css**: Profile management styling
      - **provider_profile.css**: Provider profile viewing/editing styling
      - **revenue_reports.css**: Revenue reporting interface styling
    - **customer/**: Customer-facing interface styles
      - **bookings.css**: Booking management styling
      - **cart.css**: Shopping cart interface styling
      - **home.css**: Customer home/dashboard styling
      - **profile.css**: Customer profile management styling
      - **review.css**: Review submission interface styling
      - **schedule.css**: Scheduling interface styling
      - **payment_pages/**: Payment-related page styling (directory appears empty in structure)
    - **legal/**: Legal page styling
      - **legal.css**: General legal page styling
    - **modules/**: Reusable component styles
      - **global_search.css**: Global search functionality styling
    - **provider/**: Service provider interface styles
      - **assigned-jobs.css**: Assigned jobs management styling
      - **calendar.css**: Calendar interface styling
      - **dashboard.css**: Provider dashboard styling
      - **earnings.css**: Earnings tracking interface styling
      - **notifications.css**: Provider notification styling
      - **profile.css**: Provider profile management styling
    - **service_pages/**: Service-related page styles
      - **category_page.css**: Service category page styling
      - **service_discovery.css**: Service discovery interface styling
      - **service_page.css**: Individual service page styling
    - **super_user/**: Super user/admin interface styles
      - **collective_unit.css**: Collective unit management styling
      - **manage_categories.css**: Category management interface styling
      - **manage_services.css**: Service management interface styling
      - **manage_skills.css**: Skills management interface styling
      - **notifications.css**: Super user notification styling
      - **platform_settings.css**: Platform configuration styling
      - **profile.css**: Super user profile management styling
      - **super_user_dashboard.css**: Main super user dashboard styling
      - **user_management.css**: User management interface styling
    - **unit_manager/**: Unit manager interface styles
      - **dashboard.css**: Unit manager dashboard styling
      - **notifications.css**: Unit manager notification styling
      - **profile.css**: Unit manager profile management styling
      - **provider_profile.css**: Provider profile viewing for unit managers
      - **providers.css**: Provider management interface styling
      - **revenue.css**: Revenue tracking for unit managers

  - **html/**: HTML templates and pages organized by user role and feature
    - **landing_page.html**: Main landing page template
    - **auth_pages/**: Authentication page templates
      - **login.html**: Login page template
      - **logout.html**: Logout page template
      - **register-success.html**: Registration success page template
      - **register.html**: Registration form template
    - **collective_manager/**: Collective manager page templates (structure shows additional files)
    - **customer/**: Customer page templates (structure shows directory exists)
    - **legal/**: Legal page templates (structure shows directory exists)
    - **provider/**: Service provider page templates (structure shows directory exists)
    - **reset/**: Password reset page templates (structure shows directory exists)
    - **service_pages/**: Service-related page templates (structure shows directory exists)
    - **super_user/**: Super user page templates (structure shows directory exists)
    - **unit_manager/**: Unit manager page templates (structure shows directory exists)

  - **js/**: JavaScript files for client-side functionality
    - **landing_page.js**: Landing page JavaScript logic
    - **auth_pages/**: Authentication-related JavaScript (directory exists)
    - **collective_manager/**: Collective manager JavaScript files (directory exists)
    - **customer/**: Customer JavaScript files (directory exists)
    - **data/**: Data handling JavaScript files (directory exists)
    - **modules/**: Reusable JavaScript modules (directory exists)
    - **provider/**: Service provider JavaScript files (directory exists)
    - **reset/**: Password reset JavaScript files (directory exists)
    - **service_pages/**: Service-related JavaScript files (directory exists)
    - **super_user/**: Super user JavaScript files (directory exists)
    - **unit_manager/**: Unit manager JavaScript files (directory exists)
    - **utils/**: Utility JavaScript functions (directory exists)

## Architecture Insights

The project follows a traditional web application structure with clear separation of concerns:

1. **Multi-Role User System**: The application supports multiple user types (customers, providers, managers, super users) with role-specific interfaces and functionality.

2. **Component-Based Organization**: Front-end assets are organized by user role and feature, allowing for modular development and maintenance.

3. **Database-Driven**: Uses SQL database with Docker containerization for easy deployment and development.

4. **Design-First Approach**: Comprehensive Figma designs indicate a design-first development methodology.

5. **Modular CSS and JS**: Styles and scripts are organized to match the HTML structure, promoting maintainability.

## Technology Stack

Based on file extensions and structure:

- **Front-end**: HTML, CSS, JavaScript (vanilla, no framework indicated)
- **Database**: SQL (likely MySQL/PostgreSQL based on Docker setup)
- **Containerization**: Docker and Docker Compose
- **Design**: Figma
- **Documentation**: Markdown, YAML

## Development Workflow

The structure suggests a workflow involving:

1. Design creation in Figma
2. Database schema design and implementation
3. Front-end development with role-based feature implementation
4. Documentation and testing with mock data

This comprehensive structure supports a scalable, multi-tenant service marketplace platform with administrative controls and user management capabilities.
