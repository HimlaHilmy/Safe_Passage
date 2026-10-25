# Safe Passage — Assistance Dispatch & Service Provider Portal (Module 4)

**Module Lead & Group Leader:** M.H.F. Himla (Member 4)  
**Assigned Scope:** Provider dashboards, assistance-request dispatch, provider responses, and active job lifecycle tracking.

---

## 1. Executive Summary & Architecture

The Assistance Dispatch and Service Provider Portal provides an operational workspace for certified emergency responders and roadside assistance fleets. It connects distress beacons submitted by travelers (Member 1) with nearby verified service providers, enforcing strict eligibility checks, single-claim concurrency locking, and status synchronization with the incident lifecycle manager (Member 3).

### Key Architectural Tenets:
- **Zero Race Conditions:** Atomic MongoDB concurrency controls prevent two units from accepting the same emergency request (`$set: { status: 'Accepted', providerId }` with `{ status: 'Pending', providerId: null }`).
- **Traveler Privacy Protocol:** Traveler personal identities, phone numbers, and full contact details are cryptographically shielded while requests are pending. Full details unlock only after a verified provider successfully claims the assignment.
- **Cross-Member Lifecycle Synchronization:** When a job transitions through its operational milestones (`Accepted` ➔ `En Route` ➔ `Arrived` ➔ `In Progress` ➔ `Completed`), the linked `Incident` model transitions synchronously (`Assistance Dispatched` ➔ `In Progress` ➔ `Resolved`), logging an immutable audit record in `CaseLog`.

---

## 2. Page Routing Matrix

The module delivers 7 dedicated, mobile-responsive pages matching the Safe Passage Design System:

| Route | Page Component | Functional Purpose |
|---|---|---|
| `/provider/dashboard` | `ProviderDashboardPage.jsx` | Executive command center with 4 KPIs (New Requests, Accepted, Active, Completed), instant duty switcher (Available/Off-Duty), and live queue snapshot. |
| `/provider/requests` | `ProviderRequestsPage.jsx` | Full incoming emergency dispatches queue with distance calculation, urgency badges, search, and category filtering. |
| `/provider/requests/:id` | `ProviderRequestDetailsPage.jsx` | Deep technical inspection view with React Leaflet interactive map, traveler privacy shield disclosure, and eligibility checklist. |
| `/provider/jobs` | `ProviderJobsPage.jsx` | Active field operations console with milestone progression controls, unlocked traveler direct call (`tel:`), Google Maps directions, and dispatch logging. |
| `/provider/map` | `ProviderMapPage.jsx` | Fullscreen-ready geospatial dispatch grid displaying provider base location, active missions, and nearby pending beacons with layer toggles. |
| `/provider/history` | `ProviderHistoryPage.jsx` | Historical archive of completed, declined, and resolved jobs with multi-parameter date/status filters, CSV export, and lifecycle timeline modal. |
| `/provider/profile` | `ProviderProfilePage.jsx` | Fleet organization settings, verified accreditation badge, certified service capabilities multi-selector, and GPS coordinate updater. |

---

## 3. Backend REST API Endpoints

### 3.1 Assistance Requests API (`/api/assistance-requests`)

#### `GET /api/assistance-requests/stats/summary`
- **Access:** Private (`provider`, `admin`)
- **Returns:**
  ```json
  {
    "success": true,
    "data": {
      "newRequestsCount": 3,
      "acceptedJobsCount": 1,
      "activeJobsCount": 2,
      "completedJobsCount": 14,
      "avgResponseMinutes": 13.8,
      "completionRatePercent": 98.4,
      "dutyStatus": "available"
    }
  }
  ```

#### `GET /api/assistance-requests`
- **Query Params:**
  - `status`: Filter by status (`Pending`, `Accepted`, `En Route`, `Arrived`, `In Progress`, `Completed`)
  - `filter`: Preset views (`eligible`, `active`, `history`)
  - `search`: Keyword search matching service type, reference, or address
- **Privacy Enforcement:** Pending requests return masked traveler contact data:
  ```json
  {
    "_id": "65r...",
    "serviceType": "Roadside Towing & Vehicle Repair",
    "status": "Pending",
    "distanceKm": 4.8,
    "travelerId": {
      "name": "Sarah (Confidential until dispatch accepted)",
      "phone": "+***-***-****"
    }
  }
  ```

#### `GET /api/assistance-requests/:id`
- **Access:** Private (`provider`, `traveler`, `admin`)
- **Authorization Rule:** Providers can only inspect pending pool requests or jobs assigned to themselves. Viewing another provider's active job returns `403 Forbidden`.

#### `PATCH /api/assistance-requests/:id/respond`
- **Payload:** `{ "action": "accept" | "decline", "notes": "Optional notes" }`
- **Eligibility Checks:**
  1. Provider must be authenticated and active (`accountStatus !== 'suspended'`).
  2. Provider must be on-duty (`isAvailable !== false`). Returns `400 Bad Request` if off-duty.
- **Concurrency Protection:**
  - If already accepted by another provider, returns `409 Conflict`:
    ```json
    {
      "success": false,
      "message": "Dispatch Conflict: This assistance request has already been claimed by another emergency response unit.",
      "error": "ALREADY_CLAIMED"
    }
    ```
- **Incident Synchronization:**
  - Automatically transitions linked `Incident` to `Assistance Dispatched`.
  - Creates a chronological audit entry in `CaseLog`.

#### `PATCH /api/assistance-requests/:id/status`
- **Payload:** `{ "status": "En Route" | "Arrived" | "In Progress" | "Completed", "notes": "Field log" }`
- **Valid Milestone Transitions:**
  - `Accepted` ➔ `En Route` (`enRouteAt` timestamp recorded)
  - `En Route` ➔ `Arrived` / `On Scene` (`arrivedAt` timestamp recorded)
  - `Arrived` ➔ `In Progress` (`inProgressAt` timestamp recorded; Incident transitions to `In Progress`)
  - `In Progress` ➔ `Completed` (`completedAt` timestamp recorded; Incident transitions to `Resolved`)

---

## 4. Verification and Automated Testing

A dedicated test suite has been implemented at `server/test_provider_module.js`.

To run the automated verification test suite:
```bash
node server/test_provider_module.js
```

### Verified Test Assertions (25/25 Passing):
1. **Health Diagnostics Check:** Confirms API readiness and modular mounts.
2. **Dashboard Stats Aggregation:** Verifies `newRequestsCount`, `activeJobsCount`, and SLA metrics.
3. **Pending Pool & Data Sanitization:** Confirms traveler phone and identity masking on unaccepted requests.
4. **Single-Claim Concurrency Lock:** Confirms atomic claim by Unit 1 succeeds and simultaneous claim by Unit 2 yields `409 Conflict (ALREADY_CLAIMED)`.
5. **Milestone Progression & Timestamps:** Confirms sequential lifecycle updates with `enRouteAt`, `arrivedAt`, `inProgressAt`, and `completedAt`.
6. **Timeline History Preservation:** Confirms chronological case audit log generation.
7. **Provider Profile & Duty Toggle:** Confirms duty status toggle and GPS coordinate updates.

---

## 5. Coordination with Other Team Members

- **Member 1 (Incident Submission):** Reuses the shared `Incident` model. Reads initial incident category, description, and GPS coordinates without duplication.
- **Member 2 (Maps & Directory):** Reuses `SafePassageMap` (`client/src/components/maps/MapContainer.jsx`) for geospatial visualization with OpenStreetMap tiles.
- **Member 3 (Incident Status Machine):** Status changes in the Provider Portal synchronize with the central `VALID_STATUS_TRANSITIONS` and write to `CaseLog`.
- **Member 5 (Admin Oversight):** Reuses the central `User` model (`providerDetails`, verification status) and allows administrators full audit access.
