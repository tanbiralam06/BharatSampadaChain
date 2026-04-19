# frontend/

Four React applications — one per role — plus a shared component library.

## Structure

```
frontend/
├── public-dashboard/   — Politician transparency (no login required)
├── citizen-dashboard/  — Citizen portal (Aadhaar-linked login)
├── officer-console/    — IT officer investigation tool (department credentials)
├── admin-panel/        — BSC Authority system administration
└── shared/             — Components, utilities, and types used across all four apps
    ├── components/     — Reusable UI: Badge, Card, Chart, Sidebar, TopBar
    └── utils/          — Date formatting, currency formatting, API client
```

## Why Four Separate Apps?

Each role has fundamentally different security requirements:

- The Public Dashboard must be accessible without any authentication. It cannot accidentally expose officer or citizen functionality even if there is a routing bug.
- The Citizen Portal handles personal financial data. It must be isolated from officer functionality.
- The Officer Console has write access (flag actions, escalations). Citizen users must not reach it.

Separate apps means a misconfigured route in one app cannot expose another app's screens. Role separation is structural, not just conditional rendering.

## Running Locally

Each app runs on its own port:

```bash
# Public Dashboard
cd public-dashboard && npm install && npm run dev
# → http://localhost:5173

# Citizen Dashboard
cd citizen-dashboard && npm install && npm run dev
# → http://localhost:5174

# Officer Console
cd officer-console && npm install && npm run dev
# → http://localhost:5175

# Admin Panel
cd admin-panel && npm install && npm run dev
# → http://localhost:5176
```

## Shared Components

The `shared/` directory is a local package imported by all four apps. It contains:

- `Badge` — severity badges (RED / ORANGE / YELLOW / GREEN / BLUE / GRAY)
- `Card`, `CardHover` — consistent card containers
- `WealthChart` — Recharts area chart for wealth timeline
- `AssetBreakdown` — donut chart for asset categories
- `formatCrore(amount)` — currency formatter (returns "₹67.4 Cr")
- `formatDate(isoString)` — date formatter (returns "20 Apr 2026")
- `apiClient` — Axios instance with JWT interceptor and role header

## Tech Stack

React 18 + Vite + TailwindCSS + Recharts + React Router v6

## Design System

All four apps use the same visual language:
- Background: `#03070f` (deep navy)
- Cards: `#0a1628` with `border-white/5`
- Accent: `#f59e0b` amber/saffron
- Severity: RED `#ef4444` · ORANGE `#f97316` · YELLOW `#eab308` · GREEN `#22c55e`
- Font: Inter (UI) + JetBrains Mono (code/hashes)
