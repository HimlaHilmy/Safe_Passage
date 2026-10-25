# Safe Passage — Database Schema & Data Models Specification

## 1. Overview & Data Modeling Principles

Safe Passage uses **MongoDB** with **Mongoose ODM**. The database design prioritizes:
1. **Geospatial Integrity:** All coordinates follow RFC 7946 GeoJSON format: `[longitude, latitude]` with `2dsphere` indexes.
2. **Audit Accountability:** Every incident mutation is recorded in `CaseLog` collection for transparent timeline tracking.
3. **Data Isolation & Ownership:** Defined ownership ensures no member modifies another member's schema without group leader approval.

---

## 2. Collection Schemas

### 2.1 USER COLLECTION (`users`)
**Owner:** Himla (Group Leader)  
**Indexes:** `email: 1` (unique), `'providerDetails.currentLocation': '2dsphere'`

```typescript
interface IUser {
  _id: ObjectId;
  name: string;                   // Required, max 100 chars, trimmed
  email: string;                  // Required, unique, lowercase, regex-validated
  passwordHash: string;           // Required, bcrypt hash, select: false
  role: 'traveler' | 'provider' | 'admin'; // Default: 'traveler'
  phone: string;                  // Contact phone
  accountStatus: 'active' | 'pending' | 'suspended'; // Default: 'active'
  providerDetails?: {
    serviceTypes: string[];       // e.g. ['Roadside & Towing', 'Medical First Response']
    licenseNumber: string;        // Accreditation license
    verified: boolean;            // Admin verified badge
    currentLocation: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
    isAvailable: boolean;         // Currently accepting dispatches
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.2 INCIDENT COLLECTION (`incidents`)
**Primary Owner:** Member 1 (Dulanjani)  
**Co-Owner (Lifecycle):** Member 3 (Jayasundara)  
**Indexes:** `location: '2dsphere'`, `travelerId: 1, createdAt: -1`, `status: 1`, `category: 1`, `severity: 1`

```typescript
interface IIncident {
  _id: ObjectId;
  travelerId: ObjectId;           // Ref: 'User' (Required)
  category: 
    | 'Medical Emergency'
    | 'Roadside & Vehicle Breakdown'
    | 'Crime & Theft'
    | 'Natural Hazard & Weather'
    | 'Fire Emergency'
    | 'Lost & Stranded'
    | 'Other Emergency';
  title: string;                  // Required, max 150 chars
  description: string;            // Full incident description
  severity: 'Low' | 'Medium' | 'High' | 'Critical'; // Default: 'Medium'
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude] (Validated: -180..180, -90..90)
    address: string;              // Reverse geocoded or user-supplied street address
    landmark?: string;            // Helpful landmark info
  };
  media: Array<{
    url: string;
    type: 'image' | 'video' | 'document';
    caption?: string;
    uploadedAt: Date;
  }>;
  status: 
    | 'Submitted'
    | 'Under Review'
    | 'Assigned'
    | 'Assistance Dispatched'
    | 'In Progress'
    | 'Resolved'
    | 'Cancelled';
  assignedProviderId?: ObjectId;  // Ref: 'User' (when dispatched)
  estimatedArrivalTimeMinutes?: number; // ETA in minutes
  notes?: string;                 // Triage/dispatch notes
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.3 EMERGENCY SERVICE DIRECTORY (`emergencyservices`)
**Owner:** Member 2 (Samindika)  
**Indexes:** `location: '2dsphere'`, `type: 1`, `verificationStatus: 1`

```typescript
interface IEmergencyService {
  _id: ObjectId;
  name: string;                   // Service facility name
  type: 
    | 'Hospital & Medical'
    | 'Police Station'
    | 'Fire & Rescue'
    | 'Roadside & Towing'
    | 'Embassy & Consulate'
    | 'Coast Guard & Marine';
  address: string;                // Physical street location
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  contactInfo: {
    phone: string;                // Landline / hotline
    emergencyHotline?: string;    // Direct shortcode (e.g. 1990, 119)
    email?: string;
    website?: string;
    operatingHours: string;       // Default: '24/7'
  };
  servicesOffered: string[];      // e.g. ['ICU', 'Trauma Surgery', 'Ambulance']
  verificationStatus: 'verified' | 'pending' | 'unverified';
  rating: number;                 // 1.0 - 5.0
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.4 ASSISTANCE REQUEST COLLECTION (`assistancerequests`)
**Owner:** Member 4 (Himla)  
**Indexes:** `incidentId: 1`, `providerId: 1, status: 1`, `location: '2dsphere'`

```typescript
interface IAssistanceRequest {
  _id: ObjectId;
  incidentId: ObjectId;           // Ref: 'Incident'
  travelerId: ObjectId;           // Ref: 'User'
  providerId?: ObjectId;          // Ref: 'User' (assigned provider)
  serviceType: string;            // Required service specialty
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
  };
  status: 
    | 'Pending'
    | 'Accepted'
    | 'En Route'
    | 'On Scene'
    | 'Completed'
    | 'Declined'
    | 'Cancelled';
  dispatchNotes?: string;
  acceptedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.5 CASE LOG / AUDIT HISTORY COLLECTION (`caselogs`)
**Owner:** Member 3 (Jayasundara)  
**Indexes:** `incidentId: 1, timestamp: -1`

```typescript
interface ICaseLog {
  _id: ObjectId;
  incidentId: ObjectId;           // Ref: 'Incident'
  updatedBy: ObjectId;            // Ref: 'User'
  updaterRole: 'traveler' | 'provider' | 'admin' | 'system';
  previousStatus: string;         // Status before transition
  newStatus: string;              // New status
  notes: string;                  // Operational notes explaining transition
  timestamp: Date;                // Exact UTC timestamp
}
```

---

## 3. Finite State Machine: Status Transition Rules

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

| Current Status | Allowed Next Statuses | Who Can Trigger Transition? |
|---|---|---|
| **Submitted** | `Under Review`, `Cancelled` | Traveler (cancel), Admin / Reviewer |
| **Under Review** | `Assigned`, `Cancelled` | Admin / Dispatcher |
| **Assigned** | `Assistance Dispatched`, `Cancelled` | Assigned Provider, Admin |
| **Assistance Dispatched** | `In Progress`, `Cancelled` | Assigned Provider |
| **In Progress** | `Resolved`, `Cancelled` | Assigned Provider, Admin |
| **Resolved** | *(None - Terminal)* | - |
| **Cancelled** | *(None - Terminal)* | - |
