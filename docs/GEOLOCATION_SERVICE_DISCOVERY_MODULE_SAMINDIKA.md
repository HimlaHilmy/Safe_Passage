# Safe Passage — Geolocation, Interactive Mapping & Service Discovery (Module 2)

**Module Lead & Lead Developer:** J.D.R. Samindika (Member 2)  
**Assigned Scope:** Geolocation, Interactive Mapping, Nearby Emergency Services Discovery, and Shared Map Infrastructure.

---

## 1. Executive Summary & Architecture

The **Geolocation, Interactive Mapping, and Service Discovery Module** is the spatial intelligence backbone of Safe Passage. It provides real-time situational awareness for travelers in unfamiliar territories, allowing them to instantly discover, filter, and navigate to verified trauma hospitals, tourist police posts, foreign embassies, certified mechanics, and 24/7 towing fleets.

### Core Architectural Principles:
1. **Strict RFC 7946 GeoJSON Standards:** All spatial coordinates follow `[longitude, latitude]` format and are indexed with MongoDB `2dsphere` indexes for spherical geospatial computation.
2. **Dual-Mode High Availability:** Operates in native MongoDB Atlas mode with `$nearSphere` queries, with an automatic high-speed in-memory Haversine fallback engine ensuring 100% platform uptime even in disconnected or sandboxed environments.
3. **Canonical Category Aliasing:** Supports both human-readable UI category filters (`Hospitals`, `Police Stations`, `Embassies`, `Mechanics`, `Towing Services`) and schema canonical enumerations (`Hospital & Medical`, `Police Station`, `Embassy & Consulate`, `Mechanic & Repair`, `Roadside & Towing`).
4. **Data Authenticity Standard:** Verified public facilities (national hospitals, embassies, police divisions) use real-world Sri Lankan geographic coordinates. Commercial providers are clearly designated demonstration partner records. No unverified locations are falsely labeled as official.

---

## 2. Page Routing Matrix

The module delivers responsive desktop and mobile pages matching the Safe Passage UI/UX Design System:

| Route | Page Component | Functional Purpose |
|---|---|---|
| `/traveler/services` | `TravelerServicesPage.jsx` | Dedicated service discovery page with desktop split layout (search & filters on the left, interactive Leaflet map on the right), GPS detection with permission handling, radius selector, and bidirectional marker highlighting. |
| `/traveler/map` | `TravelerMapPage.jsx` | Immersive full-screen situational map console with collapsible radar controls, quick city switchers, coverage radius circle, and floating bottom service inspector sheet. |
| Shared Components | `MapContainer.jsx`, `ServiceCard.jsx` | Reusable React Leaflet map wrapper and service card consumed by Member 1 (Reporting pin), Member 3 (Case tracking), Member 4 (Dispatch navigation), and Member 5 (Admin). |

---

## 3. Supported Service Categories

The module comprehensively supports the 5 core emergency response categories:

| Category Key | Canonical Schema Type | Visual Marker | Marker Hex | Description & Capabilities |
|---|---|---|---|---|
| **Hospitals** | `Hospital & Medical` | 🏥 Cross Icon | `#EF4444` (Red) | 24/7 trauma surgery, ICUs, cardiac care, and national ambulance fleet (1990). |
| **Police Stations** | `Police Station` | 👮 Officer Icon | `#2563EB` (Blue) | Central Tourist Police, expressway patrol, lost passport help, and emergency dispatch (119). |
| **Embassies** | `Embassy & Consulate` | 🏛️ Embassy Icon | `#9333EA` (Purple) | Diplomatic missions, consular emergency citizen evacuation, and crisis duty officers. |
| **Mechanics** | `Mechanic & Repair` | 🔧 Wrench Icon | `#D97706` (Amber) | Mobile diagnostic vans, cooling systems, brakes, alternators, and workshop garages. |
| **Towing Services** | `Roadside & Towing` | 🚛 Tow Truck Icon | `#0D9488` (Teal) | 24/7 hydraulic flatbeds, expressway standby (1969), ditch extraction, and winching. |

---

## 4. Backend REST API Endpoints Specification

### Base Path: `/api/services`

#### 4.1 Get Metadata for Categories
- **Endpoint:** `GET /api/services/categories`
- **Access:** Public
- **Response (200 OK):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "key": "Hospitals",
      "label": "Hospitals",
      "canonicalType": "Hospital & Medical",
      "icon": "Hospital",
      "color": "text-emergency-red",
      "badgeBg": "bg-red-50 text-red-700 border-red-200",
      "description": "Accredited trauma hospitals, surgical emergency rooms, and intensive care centers"
    },
    {
      "key": "Police Stations",
      "label": "Police Stations",
      "canonicalType": "Police Station",
      "icon": "Shield",
      "color": "text-blue-600",
      "badgeBg": "bg-blue-50 text-blue-700 border-blue-200",
      "description": "Tourist police divisions, law enforcement outposts, and emergency reporting desks"
    }
  ]
}
```

#### 4.2 Nearby Discovery Geospatial Query
- **Endpoint:** `GET /api/services/nearby`
- **Access:** Public
- **Query Parameters:**
  - `lng` (Required, float): Longitude (-180.0 to 180.0)
  - `lat` (Required, float): Latitude (-90.0 to 90.0)
  - `radius` (Optional, integer): Search radius in meters (100 to 500,000, default 50000)
  - `type` (Optional, string): Category filter (e.g., `Hospitals`, `Police Stations`, `Mechanics`)
  - `search` (Optional, string): Keyword filter matching facility name or street address
- **Validation Rules:**
  - Returns `400 MISSING_LONGITUDE` if `lng` is omitted.
  - Returns `400 MISSING_LATITUDE` if `lat` is omitted.
  - Returns `400 INVALID_COORDINATES` if `lat` > 90 / < -90 or `lng` > 180 / < -180.
  - Returns `400 INVALID_RADIUS` if `radius` <= 0 or > 500,000.
- **Response (200 OK):**
```json
{
  "success": true,
  "count": 15,
  "queryCenter": [79.8612, 6.9271],
  "radiusMeters": 10000,
  "categoryFilter": "All",
  "data": [
    {
      "_id": "65s000000000000000000001",
      "name": "National Hospital Emergency Trauma Unit",
      "type": "Hospital & Medical",
      "address": "Regent Street, Colombo 10",
      "location": {
        "type": "Point",
        "coordinates": [79.8653, 6.9189]
      },
      "contactInfo": {
        "phone": "+94 11 269 1111",
        "emergencyHotline": "1990",
        "operatingHours": "24/7 Continuous Trauma Care"
      },
      "servicesOffered": ["Trauma Surgery", "ICU", "Cardiac Emergency", "Ambulance Dispatch"],
      "verificationStatus": "verified",
      "rating": 4.9,
      "distanceMeters": 1024,
      "distanceKm": "1.0"
    }
  ]
}
```

#### 4.3 General Directory & Keyword Search
- **Endpoint:** `GET /api/services`
- **Access:** Public
- **Query Parameters:** `?type=...&verified=verified&search=Trauma&limit=10&lat=...&lng=...`
- **Response (200 OK):** Array of emergency services with optional distance calculation.

#### 4.4 Get Service By ID
- **Endpoint:** `GET /api/services/:id`
- **Access:** Public
- **Response (200 OK):** Returns single service record or `404 NOT_FOUND`.

---

## 5. Shared Map Components & Cross-Module Coordination

### 5.1 `SafePassageMap` (`client/src/components/maps/MapContainer.jsx`)
Unified mapping component built with React Leaflet and OpenStreetMap tiles.

#### Supported Props:
```typescript
interface SafePassageMapProps {
  center?: [number, number];            // [lat, lng] (default: Colombo [6.9271, 79.8612])
  zoom?: number;                         // Leaflet zoom level (default: 12)
  markers?: Array<ServiceOrIncident>;    // Array of objects with location.coordinates or lat/lng
  selectedMarkerId?: string | null;      // Highlights corresponding marker with gold/teal pulsing halo
  onMarkerClick?: (marker: any) => void; // Triggered when traveler clicks any map pin
  userLocation?: { lat: number; lng: number; address?: string }; // Renders pulsing red user beacon
  searchRadius?: number;                 // Radius in meters; renders semi-transparent coverage circle
  onLocationSelect?: (coords: { lat: number; lng: number }) => void; // Click-to-pin coordinate picker
  routePath?: Array<[number, number]>;   // Polyline coordinates for dispatch navigation
  height?: string;                       // CSS height (default: '500px')
  className?: string;                    // Additional Tailwind utility classes
}
```

#### Cross-Member Integration Map:
- **Member 1 (Dulanjani - Reporting Wizard):**
  Uses `SafePassageMap` with `onLocationSelect={handleMapPinSelect}` and `userLocation`. Travelers click anywhere on the map to set incident coordinates.
- **Member 3 (Jayasundara - Case Tracking):**
  Uses `SafePassageMap` with `routePath` to render live navigation polylines connecting the responding provider unit with the stranded traveler.
- **Member 4 (Himla - Dispatch & Provider Portal):**
  Uses `SafePassageMap` in `ProviderMapPage.jsx` and `ProviderRequestDetailsPage.jsx` to visualize provider base station coordinates, active mission waypoints, and pending incident requests.
- **Member 5 (Hirunika - Admin Operations):**
  Consumes `SafePassageMap` in `AdminDashboardPage` to visualize regional emergency density and facility distribution across provinces.

### 5.2 `ServiceCard` (`client/src/components/services/ServiceCard.jsx`)
Standardized emergency service card featuring:
- Category pill badge with icon and distinct color mapping
- Verified facility accreditation badge & Demonstration partner indicator
- Dynamic distance indicator (`distanceKm`)
- Star rating badge (`rating`)
- Operating hours with clock icon
- Services offered capability tags
- One-click telephone dialer (`tel:`)
- "Get Directions" action (opens Google Maps directions directly in new tab)
- Bidirectional click synchronization (highlights marker on map)

---

## 6. Testing & Quality Verification

The test suite (`server/test_service_discovery_module.js`) exercises 37 test specifications across all functional requirements:

1. **Service Categories:** Confirms all 5 assigned categories (`Hospitals`, `Police Stations`, `Embassies`, `Mechanics`, `Towing Services`) are exposed with icon metadata and canonical types.
2. **Coordinate Validation:** Validates missing longitude, missing latitude, latitude > 90, longitude > 180, non-numeric values, and negative/excessive radii.
3. **Geospatial Discovery:** Tests query execution within 10 km, verifying distance computation, ascending distance sorting, and `distanceKm` formatting.
4. **Category Filtering:** Tests independent filtering for each of the 5 categories.
5. **Keyword Search:** Validates searching by facility name, street address, and specialized capabilities.
6. **Lookup by ID:** Validates 200 OK for existing records and 404 for non-existent IDs.
7. **Frontend Build:** Verified with `npm --prefix client run build` with zero linting or bundling errors.
8. **Responsive Layouts:** Zero horizontal overflow (`overflow-x-hidden`) tested on both Desktop (1440px) and Mobile (375px) viewports with responsive tab toggling (`List View` / `Map View`).

