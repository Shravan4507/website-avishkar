# Avishkar '26 🚀

**National Level Technical Fest** — Built with React + Vite + TypeScript + Firebase

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Vanilla CSS (Glassmorphism) |
| Backend | Firebase (Auth, Firestore, Storage) |
| Hosting | Vercel |
| QR Security | HMAC-SHA256 (Web Crypto API) |

## Features

- 🎨 **Premium Glassmorphic UI** — Animated grain backgrounds, page transitions, hover effects
- 🔐 **RBAC Admin Dashboard** — Superadmin, Core Team, Department Admin, Flagship Admin roles
- 📱 **QR Virtual Pass** — HMAC-signed digital identity cards with download support
- 📷 **Volunteer Scanner** — Camera-based attendance with offline persistence (IndexedDB)
- 🏆 **Dynamic Competition Engine** — Admin-managed events with image compression & slug routing
- 📝 **Registration System** — Race-condition-proof with duplicate blocking
- 🌐 **SEO & AEO Ready** — Open Graph, Twitter Cards, JSON-LD structured data
- ⚡ **Error Boundaries** — Graceful crash recovery at app and route level

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_QR_SECRET=your_hmac_secret_key
```

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy — `vercel.json` handles SPA routing automatically

## Project Structure

```
src/
├── assets/          # Static images, fonts
├── components/      # Reusable UI components
├── context/         # React Context providers
├── data/            # Hardcoded competition data
├── firebase/        # Firebase config & initialization
├── pages/           # Route-level page components
│   ├── admin/       # Admin Dashboard & Login
│   ├── competitions/# Competition pages & Registration
│   ├── home/        # Landing page
│   └── user/        # User Dashboard & Scanner
├── routes/          # Protected route wrappers
├── utils/           # Utilities (QR crypto, image compression)
├── App.tsx          # Root component with routing
└── main.tsx         # Entry point
```

## License

© 2026 Avishkar Organizing Committee. All rights reserved.
