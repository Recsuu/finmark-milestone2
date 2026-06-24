# Project Overview: FinMark Dashboard

This document provides a summary of the features, architecture, and improvements implemented in the FinMark Dashboard application.

## 🚀 Key Features

### Initial Progress
  * Initialized both the client and admin dashboards

### 1. Dashboard & Administrative Foundation
* **Secure Data Sync:** Implemented a robust `axios` request interceptor. This automatically injects the `Authorization: Bearer <token>` header into every API call, preventing `401 Unauthorized` synchronization errors.
* **Workspace Console:** Established a clear navigation structure separating Client "Overview" metrics from Administrative "Manage All" controls.

### 2. Appointment Management
* **Database Engine:**
    * **Create (POST):** Automated request system generating unique `APT-` prefixed reference handles.
    * **Read (GET):** Persistent data fetching with integrated loading and error-handling states.
    * **Update (PUT):** Bidirectional synchronization allowing both users and administrators to modify appointment parameters and pipeline statuses.
* **Navigation & Efficiency:**
    * **Pagination:** Implemented a paginated view (5 items per page) for appointment tables.
    * **Sorting:** Added interactive sorting toggles, allowing users to filter appointment history by date.

### 3. Operational Intelligence
* **Dynamic Metrics:** A live grid on the dashboard automatically calculates:
    * **Total Appointments:** Cumulative count of all stored records.
    * **Active Processing:** Filtered real-time count of requests with "Pending" status.
* **Scheduling Calendar:** Interactive calendar component with month-navigation, allowing users to drill down into daily appointments.

### 4. UI/UX & Asset Pipeline
* **Document Attachment Pipeline:** Integrated file management support, allowing users to upload, view, and manage supporting documentation associated with specific appointment slots.
* **Admin Pipeline Control:** Added a granular status management system for Admins (Pending, Approved, In-Progress, Rejected, Completed) that dynamically updates the visibility/actionable status of appointments for the client

## Work in Progress (WIP)
* **Notification Dropdown**: Fully functional and integrated with the backend; currently filtering for role-based view permissions.
* **Live Notification Sync**: Real-time updates are active; the current focus is on maintaining clean logs within the `Notifications` table.

## AI Disclosure
This documentation and the accompanying codebase updates were developed with AI collaboration to ensure system state consistency, database idempotency, and the resolution of redundant notification triggers.

