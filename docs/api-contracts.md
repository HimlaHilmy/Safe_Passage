# Safe Passage — Shared API Contracts & Endpoint Specification

## 1. Global API Standards

- **Base URL:** `http://localhost:5000/api`
- **Content-Type:** `application/json`
- **Authentication Header:** `Authorization: Bearer <JWT_TOKEN>`

### Uniform Success Response Envelope
```json
{
  "success": true,
  "count": 10,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

### Uniform Error Response Envelope
```json
{
  "success": false,
  "message": "Human-readable error explanation.",
  "error": "ERROR_CODE_IDENTIFIER"
}
```

---

## 2. API Endpoints Specification

### 2.1 AUTHENTICATION (`/api/auth`)

#### `POST /api/auth/register`
- **Purpose:** Create new traveler or provider user account
- **Access:** Public
- **Request Body:**
```json
{
  "name": "Sarah Jenkins",
  "email": "sarah@example.com",
  "password": "Password123!",
  "role": "traveler",
  "phone": "+1 (555) 234-5678"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Sarah Jenkins", "email": "sarah@example.com", "role": "traveler" },
    "token": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

#### `POST /api/auth/login`
- **Purpose:** Authenticate and retrieve JWT token
- **Access:** Public
- **Request Body:** `{ "email": "traveler@safepassage.org", "password": "..." }`
- **Response (200 OK):** `{ "success": true, "data": { "user": { ... }, "token": "..." } }`

#### `GET /api/auth/me`
- **Purpose:** Get authenticated user profile
- **Access:** Private (Bearer Token required)
- **Response (200 OK):** `{ "success": true, "data": { "id": "...", "role": "...", ... } }`

---

### 2.2 INCIDENTS (`/api/incidents`) — Member 1 & Member 3

#### `POST /api/incidents`
- **Purpose:** Report a new emergency incident
- **Access:** Private (`traveler`, `admin`)
- **Request Body:**
```json
{
  "category": "Roadside & Vehicle Breakdown",
  "title": "Flat tire and overheated engine on highway",
  "description": "Stranded on shoulder with warning lights on.",
  "severity": "High",
  "location": {
    "type": "Point",
    "coordinates": [79.8612, 6.9271],
    "address": "Expressway KM 18 Southbound",
    "landmark": "Near toll plaza"
  },
  "media": [
    { "url": "https://...", "type": "image", "caption": "Dashboard warning" }
  ]
}
```
- **Response (201 Created):** Returns created `Incident` object with status `Submitted`.

#### `GET /api/incidents`
- **Purpose:** List incidents (Travelers get their own; Providers/Admins get system-wide)
- **Access:** Private
- **Query Params:** `?status=Submitted&category=Medical+Emergency&severity=High`
- **Response (200 OK):** `{ "success": true, "count": 3, "data": [ ... ] }`

#### `GET /api/incidents/:id`
- **Purpose:** Fetch detailed incident view
- **Access:** Private
- **Response (200 OK):** Populated incident record.

#### `PATCH /api/incidents/:id/status`
- **Purpose:** Advance incident lifecycle status
- **Access:** Private (`provider`, `admin`, or `traveler` for cancellation)
- **Request Body:**
```json
{
  "newStatus": "Assigned",
  "assignedProviderId": "65e000000000000000000002",
  "notes": "Assigned to nearest patrol unit.",
  "estimatedArrivalTimeMinutes": 15
}
```
- **Response (200 OK):** `{ "success": true, "data": { ... } }`
- **Error (400 Bad Request):** If transition violates finite state machine rules.

#### `GET /api/incidents/:id/history`
- **Purpose:** Fetch timeline and audit logs for incident
- **Access:** Private
- **Response (200 OK):** Array of `CaseLog` items sorted chronologically.

---

### 2.3 EMERGENCY SERVICES & GEOSPATIAL (`/api/services`) — Member 2

#### `GET /api/services`
- **Purpose:** Directory list of emergency facilities
- **Access:** Public
- **Query Params:** `?type=Hospital+%26+Medical&verified=verified`
- **Response (200 OK):** Array of `EmergencyService` records.

#### `GET /api/services/nearby`
- **Purpose:** Radius discovery using MongoDB 2dsphere `$nearSphere`
- **Access:** Public
- **Query Params:**
  - `lng` (Required, float): Longitude e.g. `79.8612`
  - `lat` (Required, float): Latitude e.g. `6.9271`
  - `radius` (Optional, integer): Search radius in meters, default `50000` (50km)
  - `type` (Optional, string): Filter by category
- **Response (200 OK):**
```json
{
  "success": true,
  "count": 5,
  "queryCenter": [79.8612, 6.9271],
  "radiusMeters": 50000,
  "data": [
    {
      "_id": "65s...",
      "name": "National Hospital Trauma Unit",
      "type": "Hospital & Medical",
      "location": { "type": "Point", "coordinates": [79.8653, 6.9189] },
      "distanceMeters": 1240,
      "distanceKm": "1.2"
    }
  ]
}
```

---

### 2.4 ASSISTANCE REQUESTS & DISPATCH (`/api/assistance-requests`) — Member 4 (Himla)

#### `POST /api/assistance-requests`
- **Purpose:** Dispatch assistance request to provider
- **Access:** Private (`traveler`, `admin`)
- **Request Body:** `{ "incidentId": "...", "serviceType": "Towing", "location": { ... } }`

#### `GET /api/assistance-requests`
- **Purpose:** Provider incoming queue or traveler requests
- **Access:** Private (`provider`, `traveler`, `admin`)

#### `PATCH /api/assistance-requests/:id/respond`
- **Purpose:** Provider accepts or declines incoming dispatch
- **Access:** Private (`provider`, `admin`)
- **Request Body:** `{ "action": "accept" }` or `{ "action": "decline" }`

#### `PATCH /api/assistance-requests/:id/status`
- **Purpose:** Update active job status (`En Route`, `On Scene`, `Completed`)
- **Access:** Private (`provider`, `admin`)
- **Request Body:** `{ "status": "En Route", "notes": "Patrol vehicle dispatched" }`

---

### 2.5 PROVIDER PROFILE (`/api/providers`) — Member 4 (Himla)

#### `GET /api/providers`
- **Purpose:** Public directory of verified response providers
- **Access:** Public

#### `GET /api/providers/me`
- **Purpose:** Current provider dashboard metrics and profile
- **Access:** Private (`provider`)

#### `PATCH /api/providers/me`
- **Purpose:** Toggle availability (`isAvailable: true/false`) or update GPS location
- **Access:** Private (`provider`)
- **Request Body:** `{ "isAvailable": true, "coordinates": [79.8612, 6.9271] }`

---

### 2.6 ADMIN OPERATIONS & ANALYTICS (`/api/admin`) — Member 5 (Hirunika)

#### `GET /api/admin/analytics`
- **Purpose:** Executive dashboard KPIs and Recharts datasets
- **Access:** Private (`admin` only)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": { "totalIncidents": 148, "activeEmergencies": 7, "meanResponseMinutes": 12.4 },
    "incidentsByCategory": [ ... ],
    "hourlyTrends": [ ... ],
    "monthlyResolutionTrends": [ ... ]
  }
}
```

#### `GET /api/admin/users`
- **Purpose:** User management table
- **Access:** Private (`admin` only)

#### `GET /api/admin/providers`
- **Purpose:** Provider verification and fleet review
- **Access:** Private (`admin` only)

#### `GET /api/admin/audit-logs`
- **Purpose:** Global platform audit trail
- **Access:** Private (`admin` only)
