# Safe Passage 🛡️

> **"Travel with confidence. Get help when it matters."**

Safe Passage is a modern, web-based travel emergency assistance and management platform connecting travelers with verified nearby emergency services, rapid assistance providers, and centralized operations monitoring.

---

## 👥 Five-Member Team & Module Ownership

| Member | Module | Feature Branch | Scope |
|---|---|---|---|
| **K.H.S. Dulanjani** | Emergency Reporting System | `feature/emergency-reporting` | Emergency form, GPS coordinates, severity, media attachments, incident list |
| **J.D.R. Samindika** | Geolocation & Service Discovery | `feature/service-discovery` | Interactive Leaflet maps, 2dsphere queries, nearby hospital/police filters |
| **J.K.S. Jayasundara** | Emergency Case Lifecycle Manager | `feature/case-management` | Incident finite status transitions, timeline tracking, audit case logs |
| **M.H.F. Himla** *(Leader)* | Assistance Dispatch & Provider Portal | `feature/provider-dispatch` | Provider dashboard, request response, active jobs, team architecture & release |
| **R.P.J.H. Hirunika** | Admin Analytics & Operations Dashboard | `feature/admin-analytics` | KPI summary cards, user/provider management, audit logs, Recharts analytics |

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS, React Router v7, Lucide React, Recharts, Leaflet, React Leaflet, Socket.io-client
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT Authentication, bcryptjs, Socket.io
- **Maps:** Leaflet, OpenStreetMap, MongoDB GeoJSON with 2dsphere spatial indexes

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18.0+)
- npm (v9.0+)
- MongoDB (Local daemon or MongoDB Atlas URI)

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd safe

# Install all workspace dependencies
npm run install:all
```

### Configure Environment Variables
```bash
# Setup client env
cp client/.env.example client/.env

# Setup server env
cp server/.env.example server/.env
```

### Running the Development Environment
```bash
# Option A: Run client and server in separate terminals
npm run dev:client  # Runs React Vite frontend on http://localhost:5173
npm run dev:server  # Runs Express API server on http://localhost:5000

# Option B: Run via individual directories
cd client && npm run dev
cd server && npm run dev
```

---

## 🔑 Demo Demonstration Accounts

Pre-configured accounts for instant evaluation:

| Role | Email | Password | Primary Interface |
|---|---|---|---|
| **Traveler** | `traveler@safepassage.org` | `traveler123` | `/traveler/report`, `/traveler/incidents` |
| **Provider** | `provider@safepassage.org` | `provider123` | `/provider/dashboard`, `/provider/jobs` |
| **Admin** | `admin@safepassage.org` | `admin123` | `/admin/dashboard`, `/admin/incidents` |

---

## 📖 Architecture & Documentation

All architectural contracts, schemas, and specifications are located in the [`docs/`](./docs/) directory:
- [System Architecture](./docs/architecture.md)
- [Design System & Components](./docs/design-system.md)
- [API Contracts](./docs/api-contracts.md)
- [Database Schemas & Status Engine](./docs/database-schema.md)
- [Team Responsibilities](./docs/team-responsibilities.md)
- [Integration & Git Workflow](./docs/integration-plan.md)
