# Onboarding: Getting Started with Avishkar '26

## 🚀 Local Environment Setup

1. **Clone the repository** (or navigate to the project folder).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` in the root and fill in the Firebase & Logic secrets:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_QR_SECRET=...
   ```
4. **Run Dev Server**:
   ```bash
   npm run dev
   ```

## 📦 Build & Deployment

### Vercel (Primary)
The project is optimized for Vercel. Pushing to the `main` branch usually triggers a deployment.
- **Vercel Settings**: Ensure the `Framework Preset` is set to `Vite` and `Build Command` is `npm run build`.
- **Environment Variables**: Must be added to the Vercel Dashboard for production deployments.

### Firebase Cloud Functions
To deploy changes to the backend triggers or payment logic:
```bash
firebase deploy --only functions
```

## 🛠️ Performance & Quality Bar

- **Vanilla CSS**: We use vanilla CSS for custom glassmorphism and to avoid the overhead of heavy tailwind builds.
- **Low-Spec Support**: Always consider the `data-perf` attribute before adding heavy GSAP or Framer Motion animations.
- **Image Hygiene**: Assets must be in `.webp` format and compressed via our `processImage` utility.
- **Zero-Error Policy**: Never push code that breaks the "Self-Healing" system. Check for localStorage sanitization on any new persistent features.

---

© 2026 Antigravity x Avishkar Organizing Committee.
