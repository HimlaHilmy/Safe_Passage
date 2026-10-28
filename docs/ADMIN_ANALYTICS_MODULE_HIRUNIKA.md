# Safe Passage — Admin Analytics & Operations Dashboard (Module 5)

**Module Lead Developer:** R.P.J.H. Hirunika (Member 5)  
**Assigned Scope:** Administrative monitoring, incident management interfaces, analytics, and reporting.  
**Technology Stack:** React, Tailwind CSS, React Router, Lucide React, Recharts, React Leaflet, Node.js, Express.js, MongoDB, Mongoose.

---

## 1. Executive Summary & Architecture

The **Admin Analytics and Operations Dashboard** serves as the central command room and governance hub for Safe Passage. It gives platform administrators real-time visibility into incoming distress calls, provider dispatch latency, fleet verification, directory maintenance, and compliance audits across Sri Lanka's emergency response networks.

### Core Architectural Capabilities:
1. **Live MongoDB Aggregations & Dual-Mode Fallback:**
   - When connected to MongoDB, endpoints execute real MongoDB aggregation pipelines (`$match`, `$group`, `$sort`, `$facet`, `$lookup`) to derive live platform metrics.
   - When running in an isolated or disconnected environment, it dynamically calculates statistics from memory records.
   - Responses transparently state `dataSource: 'Live MongoDB Database'` vs `dataSource: 'Demonstration / In-Memory Store'` and `isDemoData: boolean`, ensuring metrics are never presented as real if running on fallback data.
2. **Definitive Timestamp Math:**
   - **Initial Dispatch SLA / Response Time:** Calculated as the elapsed duration in minutes between incident report creation (`createdAt`) and provider assignment or initial dispatch confirmation (`updatedAt`).
   - **Resolution Time:** Calculated as the duration in minutes from report creation (`createdAt`) to the incident reaching the `Resolved` terminal state.
3. **Strict Role-Based Access Control (RBAC):**
   - All `/api/admin/*` routes strictly require verified JWT authentication and the `admin` role (`protect`, `authorize('admin')`). Non-administrators (travelers, providers, unauthenticated clients) are blocked with `401 Unauthorized` or `403 Forbidden`.
4. **Comprehensive System Audit Logging:**
   - Every state-altering administrative action (user suspension/reactivation, role changes, provider verification approvals, emergency service additions/edits/deletions, and CSV data exports) is logged in the `AuditLog` collection with actor identity, target resource, details payload, and IP address.
5. **Cross-Member Coordination:**
   - Coordinates with **Member 1 (Dulanjani)** for incident reporting schemas and categorization.
   - Coordinates with **Member 2 (Samindika)** for geospatial Leaflet mapping and emergency service GeoJSON structures.
   - Coordinates with **Member 3 (Jayasundara)** for incident detail case rooms, lifecycle status machine enforcement, and `CaseLog` history trails.
   - Coordinates with **Member 4 (Himla)** for provider assignments, active job states, and fleet verification workflows.

---

## 2. Page Routing Matrix (8 Pages)

All 8 pages are styled using the shared Safe Passage Design System and are fully responsive across desktop, tablet, and mobile devices:

| # | Route | Component | Purpose & Functional Capabilities |
|---|---|---|---|
| 1 | `/admin/dashboard` (and `/admin`) | `AdminDashboardPage.jsx` | Executive command dashboard displaying 6 real-time KPI cards (Total Incidents, Active Emergencies, Pending Triage, Resolved Cases, Mean Response Minutes, Verified Fleet), interactive React Leaflet map with pulsing beacons for active emergencies, urgent pending triage alerts banner, and 4 responsive Recharts charts (Category, Status, Hourly Influx, Provider Performance). |
| 2 | `/admin/incidents` | `AdminIncidentsPage.jsx` | Operational incident management table with search by title/location/traveler, multi-parameter filters (Category, Severity, Status), date range filtering (From/To), pagination, view toggle (Table View vs Fullscreen Map View), quick status update modal, and CSV export. |
| 3 | `/admin/incidents/:id` | `AdminIncidentDetailPage.jsx` | Comprehensive incident triage command room. Displays traveler reporter contact details, exact incident coordinates on Leaflet map, media attachments viewer, provider assignment dropdown, ETA input, operator notes, status transition selector, and chronological `CaseLog` lifecycle timeline. |
| 4 | `/admin/users` | `AdminUsersPage.jsx` | User governance directory. Summary cards (Total, Travelers, Providers, Admins, Suspended), search, role and account status filters, account suspension/reactivation toggle with `ConfirmDialog`, and role promotion/adjustment modal. |
| 5 | `/admin/providers` | `AdminProvidersPage.jsx` | Provider accreditation and verification hub. Dual-tab navigation (All Fleet Directory vs Verification Queue for pending applications), license inspection, service capabilities badges, live availability toggles, job metrics, and approve/suspend actions. |
| 6 | `/admin/services` | `AdminServicesPage.jsx` | Emergency services directory CRUD management. Summary counters for hospitals, police, fire stations, and towing bases, search, type and verification filters, full "+ Add Emergency Facility" modal, edit modal, and delete facility confirmation. |
| 7 | `/admin/analytics` | `AdminAnalyticsPage.jsx` | Dedicated executive analytics center. Timeframe filter buttons (All Time, Today, 7 Days, 30 Days, 90 Days, Custom Range), one-click RFC-compliant CSV report export, transparent methodology banner explaining timestamp formulas, and 5 interactive Recharts visualizations. |
| 8 | `/admin/audit-logs` | `AdminAuditLogsPage.jsx` | System audit ledger. Dual-tab navigation (Administrative System Actions vs Incident Case Lifecycle Transitions), action type filter, actor role filter, date window filter, search, and deep JSON payload inspection modal. |

---

## 3. Backend REST API Endpoints (`/api/admin`)

All administrative endpoints require `Authorization: Bearer <JWT_TOKEN>` with role `admin`.

### 3.1 Executive Analytics (`/api/admin/analytics`)
- **Method:** `GET`
- **Query Params:** `?range=all|24h|7d|30d|90d|custom&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "isDemoData": false,
    "dataSource": "Live MongoDB Database",
    "timestampCalculationMethod": "Elapsed minutes between incident report creation (createdAt) and initial dispatch update or resolution (updatedAt)",
    "data": {
      "summary": {
        "totalIncidents": 5,
        "activeIncidents": 3,
        "pendingAssignments": 1,
        "resolvedIncidents": 2,
        "meanResponseMinutes": 14.5,
        "verifiedProviders": 2,
        "slaComplianceRate": "95%"
      },
      "incidentsByCategory": [ ... ],
      "incidentsByStatus": [ ... ],
      "severityDistribution": [ ... ],
      "hourlyTrends": [ ... ],
      "monthlyTrends": [ ... ],
      "providerPerformance": [ ... ]
    }
  }
  ```

### 3.2 Incident Management (`/api/admin/incidents`)
- **`GET /api/admin/incidents`**: Query with `search`, `category`, `severity`, `status`, `startDate`, `endDate`, `page`, `limit`. Returns paginated incident list populated with traveler and provider objects.
- **`GET /api/admin/incidents/:id`**: Returns full incident record with populated traveler, assigned provider, and related `CaseLog` timeline history.
- **`PATCH /api/admin/incidents/:id`**: Updates status, assigned provider ID, estimated arrival time (ETA in minutes), and dispatcher override notes. Creates a `CaseLog` transition entry and logs `INCIDENT_STATUS_UPDATE` or `INCIDENT_ASSIGNMENT` in `AuditLog`.

### 3.3 User Management (`/api/admin/users`)
- **`GET /api/admin/users`**: Query with `search`, `role`, `status`, `page`, `limit`. Returns users without passwords, pagination data, and summary counts (`travelers`, `providers`, `admins`, `suspended`).
- **`PATCH /api/admin/users/:id/status`**: Updates user `accountStatus` (`active`, `suspended`, `pending`) or `role`. Records `USER_STATUS_CHANGE` or `USER_ROLE_CHANGE` in `AuditLog`.

### 3.4 Provider Approvals (`/api/admin/providers`)
- **`GET /api/admin/providers`**: Returns provider users with license numbers, service capabilities, availability, and calculated metrics (total assigned, resolved, active jobs).
- **`PATCH /api/admin/providers/:id/verify`**: Sets `providerDetails.verified = true/false` and updates account status. Records `PROVIDER_VERIFIED` or `PROVIDER_REJECTED` in `AuditLog`.

### 3.5 Emergency Services Directory CRUD (`/api/admin/services`)
- **`GET /api/admin/services`**: Query with `search`, `type`, `verificationStatus`, `page`, `limit`. Returns facilities and summary counts.
- **`POST /api/admin/services`**: Creates a new emergency facility (`name`, `type`, `address`, `coordinates [lng, lat]`, `contactInfo`, `servicesOffered`). Records `SERVICE_CREATED` in `AuditLog`.
- **`PATCH /api/admin/services/:id`**: Updates facility details. Records `SERVICE_UPDATED` in `AuditLog`.
- **`DELETE /api/admin/services/:id`**: Removes facility from directory. Records `SERVICE_DELETED` in `AuditLog`.

### 3.6 System Audit Logs & Export (`/api/admin/audit-logs`, `/api/admin/export/csv`)
- **`GET /api/admin/audit-logs`**: Query with `search`, `action`, `role`, `startDate`, `endDate`, `page`, `limit`. Returns administrative audit entries and incident lifecycle logs.
- **`GET /api/admin/export/csv`**: Generates and streams an RFC-compliant CSV report containing incident ID, title, category, severity, status, reporter details, assigned provider, coordinates, timestamps, and calculated response minutes.

---

## 4. Verification & Testing

An automated test suite is provided in `server/test_admin_module.js`:

```powershell
cd Safe_Passage/server
node test_admin_module.js
```

### Verification Results:
- **RBAC Security:** 401 without token, 403 for traveler token, 403 for provider token, 200 for authorized admin.
- **Analytics:** Calculates numeric metrics, provides data source transparency, defines timestamp formula.
- **Incident Management:** Multi-criteria filtering, text search, pagination, single detail query, and administrative override.
- **User Governance:** Directory listing, role filter, status suspension patch.
- **Provider Approvals:** Verification status patch and fleet inspection.
- **Emergency Services CRUD:** Full POST, GET, PATCH, and DELETE lifecycle.
- **Audit Logging:** System logs entries upon every administrative mutation.
- **CSV Export:** Delivers formatted text/csv output with proper headers and filtered rows.

**Total Test Result:** 42 Passed, 0 Failed.

