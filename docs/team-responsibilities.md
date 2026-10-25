# Safe Passage — Team Responsibilities & Ownership Matrix

## 1. Project Overview & Leadership

**Project Name:** Safe Passage  
**Tagline:** Travel with confidence. Get help when it matters.  
**Leadership:** M.H.F. Himla (Group Leader & Lead Architect)  

Safe Passage is structured around **5 independent yet cohesive modules** developed by 5 university team members. The foundation ensures shared architecture, unified UI/UX, shared authentication, and single source of truth for database models and API contracts.

---

## 2. Team Member Breakdown & Module Ownership

| Member | Name | Module Name | Git Feature Branch | Model Ownership | Primary UI Routes |
|---|---|---|---|---|---|
| **Member 1** | **K.H.S. Dulanjani** | Emergency Reporting System | `feature/emergency-reporting` | `Incident` (Reporting fields), Media | `/traveler/report`, `/traveler/incidents` |
| **Member 2** | **J.D.R. Samindika** | Geolocation & Service Discovery | `feature/service-discovery` | `EmergencyService` (Directory & GeoJSON) | `/services`, `/traveler/services`, `/traveler/map` |
| **Member 3** | **J.K.S. Jayasundara** | Emergency Case Lifecycle Manager | `feature/case-management` | `CaseLog`, Status Machine | `/traveler/incidents/:id`, `/provider/jobs/:id` |
| **Member 4 & Leader** | **M.H.F. Himla** | Assistance Dispatch & Provider Portal | `feature/provider-dispatch` | `AssistanceRequest`, Provider assignment | `/provider/*`, Shared Core Architecture |
| **Member 5** | **R.P.J.H. Hirunika** | Admin Analytics & Operations Dashboard | `feature/admin-analytics` | Audit logs, System analytics | `/admin/*` |

---

## 3. Detailed Responsibilities by Member

### Member 1 — K.H.S. Dulanjani (Emergency Reporting System)
- **Primary Goal:** Enable travelers in crisis to report incidents quickly, accurately, and intuitively across devices.
- **Key Responsibilities:**
  - Emergency reporting wizard (single-tap emergency vs. detailed reporting).
  - Categorization (Medical, Roadside/Vehicle, Crime/Theft, Natural Hazard, Fire, Lost/Stranded).
  - Severity level assignment (`low`, `medium`, `high`, `critical`).
  - Browser GPS capture (`navigator.geolocation`) with fallback manual address input.
  - Image/media attachment simulation & upload handler.
  - Traveler's Submitted Incident List (`/traveler/incidents`) with status cards.
- **Frontend Directory:** `client/src/features/reporting/`
- **Backend Controllers/Routes:** `server/controllers/incidentController.js` (create & list traveler incidents)

### Member 2 — J.D.R. Samindika (Geolocation and Service Discovery)
- **Primary Goal:** Allow travelers and operators to visualize and locate verified emergency providers near their coordinates.
- **Key Responsibilities:**
  - Interactive Leaflet map container (`MapContainer`, `TileLayer`, custom SVG marker pins).
  - Geospatial query execution (MongoDB `$nearSphere` and `$geoWithin`).
  - Nearby emergency service listing (Hospitals, Police, Fire, Roadside Towing, Embassies).
  - Location search box (Nominatim / OpenStreetMap geocoding integration or coordinate picker).
  - Service category filter bar (Radius selector: 5km, 10km, 25km, 50km).
  - Reusable Map component utilized by Member 1 (pin incident), Member 3 (track incident), and Member 4 (provider navigation).
- **Frontend Directory:** `client/src/features/service-discovery/`, `client/src/components/maps/`
- **Backend Controllers/Routes:** `server/controllers/serviceController.js`

### Member 3 — J.K.S. Jayasundara (Emergency Case Lifecycle Manager)
- **Primary Goal:** Guarantee case integrity, enforceable status transitions, and real-time tracking for peace of mind.
- **Key Responsibilities:**
  - Incident Status Engine enforcing strict finite state transitions.
  - Real-time Incident Tracking Timeline (Visual step-by-step progress indicator).
  - Case Audit Trail & History logging (`CaseLog` entries on every status mutation).
  - Coordination between initial report, triage under review, assignment, and dispatch.
  - Case notes and timeline event cards for both traveler and provider views.
- **Frontend Directory:** `client/src/features/case-management/`
- **Backend Controllers/Routes:** `server/controllers/caseLogController.js`, `server/services/lifecycleService.js`

### Member 4 — M.H.F. Himla (Assistance Dispatch & Provider Portal)
- **Primary Goal:** Connect vetted local providers with active emergency incidents to dispatch rapid assistance.
- **Key Responsibilities:**
  - Provider Onboarding & Profile Verification Dashboard (`/provider/dashboard`).
  - Live Incoming Assistance Requests queue with countdown and response actions (Accept / Decline).
  - Active Job Management interface with quick-action status updates (En Route, On Scene, Completed).
  - Route guidance preview & distance calculation from provider to incident coordinates.
  - Completed job history, provider earnings/metrics, and feedback log.
- **Frontend Directory:** `client/src/features/dispatch/`, `client/src/pages/provider/`
- **Backend Controllers/Routes:** `server/controllers/assistanceController.js`, `server/controllers/providerController.js`

### Member 5 — R.P.J.H. Hirunika (Admin Analytics and Operations Dashboard)
- **Primary Goal:** Oversee platform health, monitor incident resolution SLAs, manage directories, and audit activities.
- **Key Responsibilities:**
  - Executive KPI summary cards (Total Incidents, Active Emergencies, Mean Response Time, Verified Providers).
  - Incident Management Table with multi-criteria filtering, severity badges, and manual override.
  - User and Provider Management interface (Approve, Suspend, Verify providers).
  - Emergency Services Directory CRUD (Add/edit local police stations, hospitals, towing bases).
  - Interactive Recharts analytics (Incidents by category, peak emergency hours, regional heatmaps).
  - System Audit Log viewer for accountability and compliance.
- **Frontend Directory:** `client/src/features/analytics/`, `client/src/pages/admin/`
- **Backend Controllers/Routes:** `server/controllers/adminController.js`

---

## 4. Group Leader Coordination (Himla)
As Group Leader, Himla oversees:
1. **Repository Health:** Enforcing branch rules, semantic commits, and approving Pull Requests.
2. **Shared Design Tokens:** Ensuring all members consume `components/common/` rather than rolling custom buttons/inputs.
3. **Database Consistency:** Preventing schema drift; all MongoDB models are centralized in `server/models/`.
4. **API Versioning:** Enforcing uniform JSON response schema `{ success: boolean, data: any, message?: string, error?: string }`.
5. **Quality & Release:** Cross-browser responsiveness checks, test runs, and final university demonstration rehearsal.
