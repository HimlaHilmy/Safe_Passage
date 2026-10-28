# Safe Passage — Emergency Case Lifecycle Manager (Module 3)

**Module Lead Developer:** J.K.S. Jayasundara (Member 3)  
**Assigned Scope:** Incident tracking, status management, chronological case history, and finite state machine lifecycle business logic.

---

## 1. Executive Summary & Architecture

The Emergency Case Lifecycle Manager guarantees platform-wide integrity, auditability, and real-time operational tracking for every emergency reported on Safe Passage. By modeling incident progression as a deterministic Finite State Machine (FSM), the module ensures that emergency cases transition only through valid operational milestones, preventing state corruption, duplicate or premature closures, and unauthorized modifications.

### Key Architectural Tenets:
- **Strict Finite State Machine (FSM):** Enforces legal state progression (`Submitted` ➔ `Under Review` ➔ `Assigned` ➔ `Assistance Dispatched` ➔ `In Progress` ➔ `Resolved`). Any out-of-order transition or premature jump is rejected with `HTTP 400 Bad Request (ILLEGAL_STATUS_TRANSITION)`.
- **Terminal State Immutability:** Once an incident reaches `Resolved` or `Cancelled`, no further mutations are allowed (`HTTP 400 TERMINAL_STATE`).
- **Role-Based Transition Authorization:** Role permissions dictate which actor can trigger specific milestones (e.g., Travelers can cancel their own emergencies, Dispatchers triage and assign, while certified Providers report on-scene progress).
- **Immutable CaseLog Audit Trail:** Every status change and operator progress note generates an append-only document in the `CaseLog` collection recording the previous status, new status, actor ID, role, operational notes, and UTC timestamp.
- **Bi-directional Real-Time Socket.io Synchronization:** State mutations immediately emit socket broadcasts (`incident_updated` and `case_log_added`) to both incident-specific rooms (`incident_:id`) and global role channels (`role_traveler`, `role_provider`, `role_admin`).

---

## 2. Finite State Machine Specification

```
[Submitted] ─────────► [Under Review] ─────────► [Assigned]
     │                      │                         │
     │ (Cancel)             │ (Cancel)                │ (Cancel)
     ▼                      ▼                         ▼
[Cancelled]            [Cancelled]            [Assistance Dispatched]
                                                      │
                                                      ▼
                                                [In Progress]
                                                      │
                                                      ▼
                                                 [Resolved]
```

### Transition Enforcement Matrix:

| Current Status | Allowed Next Statuses | Permitted Roles | Description |
|---|---|---|---|
| **Submitted** | `Under Review`, `Cancelled` | Admin, Traveler (cancel) | Initial distress beacon logged. Operator triages coordinates and sets priority. |
| **Under Review** | `Assigned`, `Cancelled` | Admin, Traveler (cancel) | Verified incident is matched with an accredited emergency service provider. |
| **Assigned** | `Assistance Dispatched`, `Cancelled` | Provider, Admin, Traveler (cancel) | Response crew accepts the dispatch mission and departs base. |
| **Assistance Dispatched** | `In Progress`, `Cancelled` | Provider, Admin | Responding crew arrives on scene and initiates rescue/repair operations. |
| **In Progress** | `Resolved`, `Cancelled` | Provider, Admin | Direct emergency assistance completed safely. Case archived. |
| **Resolved** | *(None — Terminal)* | None | Terminal state. Case closed and locked for audit compliance. |
| **Cancelled** | *(None — Terminal)* | None | Terminal state. Response crews stood down. |

---

## 3. Page Routing & Delivered Interfaces

The module delivers 3 primary responsive interfaces conforming to the Safe Passage Design System:

| Route / Component | Target Interface | Functional Purpose |
|---|---|---|
| `/traveler/incidents` | `MyIncidentsPage.jsx` | Traveler emergency case console displaying all submitted reports with 4 KPI summary cards, search bar, multi-criteria status/severity filter chips, toggleable Card Grid / Table views, and incident reference tags. |
| `/traveler/incidents/:id` | `IncidentTrackingPage.jsx` | Deep lifecycle inspection center featuring the visual 6-step progress stepper, pinned Leaflet emergency coordinates map, assigned provider card with direct click-to-call, interactive case note logger, and evaluator testing bar. |
| Shared Component | `SharedIncidentDetailsModal.jsx` | Reusable modal component embedded within `AdminIncidentsPage.jsx` allowing administrators to inspect full incident metadata, view live maps, examine chronological case logs, and execute permitted state transitions. |

---

## 4. Functional Requirements Verification

The module fulfills all 9 mandatory field requirements from the project specification:

1. **Incident reference:** Formatted unique code (`#SP-REF-000010` / `SP-REF-XXXXXX`) with one-click copy to clipboard.
2. **Category:** High-contrast emergency category badge (e.g. *Medical Emergency*, *Roadside & Vehicle Breakdown*).
3. **Title:** Prominent incident headline.
4. **Description:** Complete incident narrative describing passengers, conditions, and hazards.
5. **Severity:** Semantic color-coded severity pill (`Critical`, `High`, `Medium`, `Low`).
6. **Reported time:** Formatted localized timestamp + relative elapsed duration (e.g., *"Oct 28, 2026 • 2h ago"*).
7. **Location:** Complete street address, nearby landmark, exact GPS coordinates `[lat, lng]`, and interactive Leaflet map pin.
8. **Current status:** Real-time status pill accompanied by the 6-stage lifecycle progress stepper.
9. **Relevant assignment information:** Dedicated card displaying assigned response crew name, verified badge, accreditation license, direct phone number (`tel:`), rating, and estimated arrival time (ETA in minutes).

---

## 5. Backend REST API Endpoints

### 5.1 `GET /api/incidents`
- **Access:** Private (Travelers view own; Admins view all)
- **Query Filters:** `?status=Submitted&severity=High&category=Medical+Emergency&search=ref`
- **Response:** Array of populated `Incident` records with `incidentReference`.

### 5.2 `GET /api/incidents/:id`
- **Access:** Private
- **Response:** Single populated `Incident` document including populated `travelerId` and `assignedProviderId`.

### 5.3 `PATCH /api/incidents/:id/status`
- **Access:** Private (Authorized roles only)
- **Request Body:**
  ```json
  {
    "newStatus": "Assigned",
    "assignedProviderId": "65e000000000000000000002",
    "estimatedArrivalTimeMinutes": 18,
    "notes": "Assigned to Apex Rapid Response Ltd patrol unit 4."
  }
  ```
- **Validation:** Enforces `validateTransition()` finite state machine rules. Returns `400 Bad Request` with `ILLEGAL_STATUS_TRANSITION` or `TERMINAL_STATE` if invalid.
- **Side Effects:** Updates incident document, writes append-only record to `CaseLog`, and broadcasts Socket.io event.

### 5.4 `GET /api/incidents/:id/history`
- **Access:** Private
- **Response:** Chronological array of `CaseLog` items sorted ascending by timestamp.

### 5.5 `POST /api/incidents/:id/notes`
- **Access:** Private
- **Request Body:** `{ "notes": "Patient is responsive; bleeding stabilized." }`
- **Response:** Appends operational progress note to the case log without altering current status.

---

## 6. Verification and Automated Testing

A dedicated automated test suite has been developed and verified at `server/test_case_lifecycle_module.js`.

### How to Run:
```bash
cd Safe_Passage/server
node test_case_lifecycle_module.js
```

### Verified Test Assertions (35/35 Passing):
- **Health Diagnostics:** Confirms API health and module route mounting.
- **Mandatory Field Presence:** Confirms display of reference, category, title, description, severity, reported time, location coordinates/address, status, and assignment info.
- **Sequential FSM Progression:** Traces `Submitted` ➔ `Under Review` ➔ `Assigned` ➔ `Assistance Dispatched` ➔ `In Progress` ➔ `Resolved`.
- **Terminal State Enforcement:** Confirms transitions from `Resolved` or `Cancelled` are rejected with `TERMINAL_STATE`.
- **Illegal Jump Prevention:** Confirms transitions skipping stages (e.g. `Submitted` ➔ `Resolved`) are rejected with `ILLEGAL_STATUS_TRANSITION`.
- **Cancellation Workflow:** Confirms traveler can safely cancel emergency and crews are stood down.
- **Chronological Case Logs:** Confirms all 6 lifecycle events are preserved in order with actor roles and timestamps.
- **Operational Progress Notes:** Confirms addition of progress notes via `POST /api/incidents/:id/notes`.
