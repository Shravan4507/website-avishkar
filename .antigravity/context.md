# Project Context: Avishkar '26 🚀

**Avishkar '26** is the official platform for the National Level Technical Fest. It is built as a highly performant, visually premium, and resilient Single Page Application (SPA).

## 🏗️ Core Architecture

- **Frontend**: React 19 + TypeScript (Vite-powered).
- **Backend-as-a-Service**: Firebase (Auth, Firestore, Storage, Hosting).
- **Edge Logic**: Firebase Cloud Functions (Transaction handling, Payments, Emails).
- **Deployment**: Vercel (Primary) & Firebase Hosting (Fallback/CLI).

## 🛠️ Tech Stack Details

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Core** | React 19 + TS | Main UI Framework |
| **Animation** | Framer Motion + GSAP | Premium Glassmorphic transitions |
| **Styling** | Vanilla CSS | Performance-optimized visual tokens |
| **Backend** | Firebase | Serverless infrastructure |
| **Payment** | Easebuzz | UPI & Card payment processing |
| **PWA** | Vite PWA Plugin | Offline support & Installability |
| **QR** | Web Crypto API | HMAC-SHA256 signed identity |

## 📁 Directory Map

- `src/components/`: Reusable UI modules (Navbar, Sidebar, Toast).
- `src/pages/`: Route-level views.
  - `/admin`: RBAC-protected management portal.
  - `/user`: Personal dashboards & QR pass.
  - `/competitions`: Dynamic event engine and registration flows.
- `src/firebase/`: Initialization and service exports.
- `src/hooks/`: Custom logic for performance, auth, and data fetching.
- `src/utils/`: Cryptography, image compression, and error reporting.
- `functions/`: Server-side triggers (Email/Payment/Transactions).

## 🛡️ Core Systems

### 1. Robustness (Self-Healing)
The `App.tsx` includes a global **Immune System** that:
- Sanitizes corrupted `localStorage` keys automatically on load.
- Reports unhandled promise rejections to a central error collection.
- Uses `ErrorBoundary` at the route level to prevent full-app crashes.

### 2. High-Fidelity Design
The `index.css` implements a **Glassmorphic Design System** using:
- `Grainient`: Custom noise-simulating backgrounds.
- Performance toggles: Heavy effects are auto-disabled for low-spec devices via `useMemo` and CSS `data-perf`.

### 3. Dynamic Registry
Competition data is dual-model:
- **Static**: `src/data/competitions.ts` for UI and rules.
- **Dynamic**: Firestore `registrations` and `pending_registrations` for live transaction tracking.
