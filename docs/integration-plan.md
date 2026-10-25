# Safe Passage — Team Integration Plan & Git Workflow

## 1. Git Workflow & Branch Strategy

The team maintains **one shared Git repository** with strict branch isolation to prevent merge conflicts.

```
                  ┌── feature/emergency-reporting (Dulanjani) ──┐
                  ├── feature/service-discovery (Samindika) ────┤
[main] ──► [develop] ── feature/case-management (Jayasundara) ──┼──► [develop] ──► [main (Release)]
                  ├── feature/provider-dispatch (Himla) ────────┤
                  └── feature/admin-analytics (Hirunika) ───────┘
```

### Official Feature Branches:
1. `feature/emergency-reporting` — Owned by Member 1 (K.H.S. Dulanjani)
2. `feature/service-discovery` — Owned by Member 2 (J.D.R. Samindika)
3. `feature/case-management` — Owned by Member 3 (J.K.S. Jayasundara)
4. `feature/provider-dispatch` — Owned by Member 4 & Group Leader (M.H.F. Himla)
5. `feature/admin-analytics` — Owned by Member 5 (R.P.J.H. Hirunika)

---

## 2. Developer Workflow Guide

### Step 1: Clone and Checkout Your Branch
```bash
# Clone the repository
git clone <repository_url>
cd safe

# Switch to your designated feature branch
git checkout -b feature/emergency-reporting # (Member 1 example)
```

### Step 2: Install Dependencies
```bash
# Install root, client, and server dependencies
npm run install:all
```

### Step 3: Configure Environment Variables
Copy example files:
```bash
# Frontend
cp client/.env.example client/.env

# Backend
cp server/.env.example server/.env
```

### Step 4: Run Development Environment
You can run client and server concurrently or independently:
```bash
# Run both frontend and backend
npm run dev:client # In Terminal 1 (runs on http://localhost:5173)
npm run dev:server # In Terminal 2 (runs on http://localhost:5000)
```

### Step 5: Committing Your Work
Use semantic commit messages:
- `feat(reporting): add offline GPS location fallback`
- `fix(discovery): resolve Leaflet marker pin clipping`
- `feat(lifecycle): validate illegal status progression`
- `style(dispatch): refine mobile acceptance card layout`

---

## 3. Pull Request & Integration Rules

1. **Never commit directly to `main` or `develop`.**
2. **Shared Code Protection:** If your feature requires modifying `server/models/` or `client/src/components/common/`, you must coordinate with Group Leader Himla.
3. **Pre-PR Checklist:**
   - [ ] Run `npm run build:client` to ensure zero compilation/lint errors.
   - [ ] Verify both Desktop (1440px) and Mobile (375px) browser rendering.
   - [ ] Test API responses match `docs/api-contracts.md`.
   - [ ] Ensure no secret API keys, JWT secrets, or DB passwords are committed.
4. **Pull Request Approval:** Requires review and sign-off by Group Leader Himla and the affected module owner before merging into `develop`.

---

## 4. Conflict Resolution Strategy

If merge conflicts occur when syncing with `develop`:
```bash
# Fetch latest upstream changes
git fetch origin
git checkout develop
git pull origin develop

# Rebase or merge develop into your feature branch
git checkout feature/<your-module>
git merge develop

# Open conflicted files in VS Code / IDE
# Accept incoming or current change preserving shared contracts
# Stage resolved files
git add .
git commit -m "chore: resolve merge conflicts with develop"
git push origin feature/<your-module>
```

---

## 5. End-to-End Module Integration Matrix

| Integration Point | Sender Module | Receiver Module | Shared Data / Event Contract |
|---|---|---|---|
| **Incident Created** | Member 1 (Reporting) | Member 3 (Lifecycle) & Member 4 (Dispatch) | Incident record created; `CaseLog` entry logged; socket event `report_emergency` broadcast |
| **Service Pinning** | Member 2 (Discovery) | Member 1 (Reporting) & Member 4 (Dispatch) | Reusable `MapContainer` component embedded in reporting wizard & provider navigation |
| **Status Update** | Member 4 (Provider) | Member 3 (Lifecycle) & Member 1 (Traveler) | `PATCH /api/incidents/:id/status`; realtime socket event `incident_updated` |
| **KPI Aggregation** | Members 1, 2, 3, 4 | Member 5 (Admin) | Aggregated queries over `incidents`, `users`, `assistancerequests`, and `caselogs` |
