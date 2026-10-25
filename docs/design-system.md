# Safe Passage — Shared UI/UX Design System Guide

## 1. Visual Identity & Brand Philosophy

Safe Passage is a high-reliability emergency assistance platform. The visual identity balances **urgent emergency clarity** with **reassuring institutional trust and modern SaaS polish**.

- **Primary Metaphor:** A protective beacon in moments of uncertainty.
- **Design Language:** Clean glassmorphism, crisp typography, generous whitespace, and unmistakable emergency indicators.

---

## 2. Color Palette & Design Tokens

```css
:root {
  /* Brand Core Palette */
  --color-brand-navy: #10243A;       /* Dominant header, deep accents */
  --color-brand-navy-light: #183B56; /* Sidebar background, card headers */
  --color-brand-teal: #14B8A6;       /* Primary brand action, safe beacons */
  --color-brand-teal-dark: #0F766E;  /* Hover state for primary actions */
  --color-brand-bg: #F5F8FC;         /* Page canvas background (never pure white) */
  --color-white: #FFFFFF;            /* Surface elevation */
  
  /* Semantic Status Colors */
  --color-emergency-red: #EF4444;    /* Critical alerts, SOS trigger */
  --color-warning-amber: #F59E0B;    /* Under review, medium severity */
  --color-success-green: #22C55E;    /* Resolved, verified provider, operational */
  
  /* Typography Text Colors */
  --color-main-text: #172B4D;        /* Primary heading and body text */
  --color-secondary-text: #64748B;   /* Subtitles, timestamps, metadata */
}
```

### Tailwind Class Reference

| Token Name | Hex Code | Tailwind Utility Class | Usage Context |
|---|---|---|---|
| Primary Navy | `#10243A` | `bg-brand-navy`, `text-brand-navy` | Navigation bar, modal headers, major titles |
| Secondary Navy | `#183B56` | `bg-brand-navy-light` | Dashboard sidebar, secondary dark panels |
| Brand Teal | `#14B8A6` | `bg-brand-teal`, `text-brand-teal` | Primary action buttons, active links, verified checkmarks |
| Page Canvas | `#F5F8FC` | `bg-brand-bg` | Full window body background |
| Emergency Red | `#EF4444` | `bg-emergency-red`, `text-emergency-red` | SOS button, critical severity badge, cancel alert |
| Warning Amber | `#F59E0B` | `bg-warning-amber`, `text-warning-amber` | Medium severity, pending review status |
| Success Green | `#22C55E` | `bg-success-green`, `text-success-green` | Resolved status, active online indicator |

---

## 3. Typography Hierarchy

Safe Passage loads two Google Fonts:
1. **Manrope** — Display & Headings (`h1`, `h2`, `h3`, KPI numbers). Clean, geometric, authoritative.
2. **Inter** — Body, inputs, labels, tables, and navigation links. Maximum legibility at small sizes.

| Level | Size (Desktop / Mobile) | Weight | Line Height | Usage |
|---|---|---|---|---|
| **H1 Display** | `2.75rem (44px)` / `2.0rem (32px)` | 800 (Extrabold) | 1.15 | Hero landing headline, main dashboard title |
| **H2 Section** | `1.875rem (30px)` / `1.5rem (24px)` | 700 (Bold) | 1.25 | Section headers, card group titles |
| **H3 Subsection** | `1.25rem (20px)` / `1.125rem (18px)` | 600 (Semibold) | 1.35 | Modal headers, feature card headings |
| **Body Standard** | `1.0rem (16px)` | 400 (Regular) | 1.60 | Paragraph descriptions, form inputs |
| **Body Small / Meta** | `0.875rem (14px)` | 500 (Medium) | 1.50 | Timestamps, table cells, secondary badges |
| **Micro Labels** | `0.75rem (12px)` | 600 (Semibold) | 1.40 | Form field caps, uppercase status tags |

---

## 4. Surfaces, Depth, and Glassmorphism

- **Card Base:** `bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300`
- **Glassmorphic Surface:** `bg-white/85 backdrop-blur-md border border-white/60`
- **Dark Glass Surface:** `bg-brand-navy/90 backdrop-blur-lg border border-white/10 text-white`
- **Border Radius Standards:**
  - Badges & Pills: `rounded-full`
  - Inputs & Buttons: `rounded-xl`
  - Cards & Panels: `rounded-2xl`
  - Large Hero Frames & Modals: `rounded-3xl`

---

## 5. Specification of the 20 Shared UI Components

Every member imports these shared components from `client/src/components/common/` and `client/src/components/layout/`.

1. **BrandLogo:** Shield mark with medical cross and directional arrow in Brand Teal.
2. **PublicNavbar:** Sticky header with glassmorphism, responsive hamburger menu, and quick SOS button.
3. **DashboardSidebar:** Role-aware navigation drawer (Traveler, Provider, Admin) with active route indicator.
4. **DashboardTopbar:** User profile avatar, current role badge, notifications dropdown, and quick logout.
5. **Button:** Variants: `primary` (Teal), `secondary` (Navy), `emergency` (Red), `outline`, `ghost`.
6. **Input:** Floating or labeled text/email/password inputs with validation error message state.
7. **Select:** Accessible dropdown with custom chevron, search capability, and clean option rows.
8. **Card:** Content card with header slot, body, footer, and optional elevation hover animation.
9. **StatusBadge:** Pill badge automatically mapping incident status to appropriate color tokens.
10. **Table:** Responsive table with zebra striping, sticky header, and empty fallback.
11. **Modal:** Centered modal with backdrop blur, Escape key listener, and entrance animation.
12. **ConfirmDialog:** Danger confirmation modal for irreversible actions (e.g., incident cancellation).
13. **ToastNotification:** Non-blocking notification banner (Success, Error, Warning, Info).
14. **LoadingSpinner:** Branded dual-ring spinning indicator in Teal/Navy.
15. **EmptyState:** Friendly SVG icon, supportive message, and actionable primary button.
16. **ErrorState:** Alert banner with retry trigger for network/server glitches.
17. **SearchBar:** Search input with embedded Lucide search icon and clear button.
18. **FilterControls:** Multi-category pill selector with active states and radius dropdown.
19. **PageHeader:** Standardized top-of-page layout with title, subtitle, breadcrumbs, and action CTA.
20. **MapContainer:** Responsive Leaflet wrapper with attribution, zoom controls, and loading state.

---

## 6. Responsive Breakpoint Rules

| Breakpoint | Width Range | Layout Rule |
|---|---|---|
| **Desktop (2xl)** | `1440px+` | Persistent sidebar (280px), multi-column 3-4 card grids, expansive map view. |
| **Laptop (lg)** | `1024px – 1439px` | Compact sidebar (240px), 2-3 column grids, full feature visibility. |
| **Tablet (md)** | `768px – 1023px` | Collapsible sidebar, 2-column forms, stacked map/list split view. |
| **Mobile (sm)** | `320px – 767px` | Slide-in drawer, full-width single-column forms, floating emergency SOS bar. |
