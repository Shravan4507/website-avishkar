import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { 
  initializeFirestore,
  getFirestore,
  persistentLocalCache, 
  persistentMultipleTabManager,
  type Firestore
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// --- CONFIGURATION GUARD ---
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "undefined") {
  throw new Error("FIREBASE_CONFIG_ERROR: Missing environment variables.");
}

// HMR-Safe Firebase App Initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// HMR-Safe Firestore Initialization
// initializeFirestore throws if called again on an already-initialized app (Vite HMR).
// getFirestore() safely returns the existing instance in that case.
let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch {
  db = getFirestore(app);
}
export { db };

export const auth = getAuth(app);
export const storage = getStorage(app);

// Safe Analytics Initialization
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(err => {
    console.warn("Firebase Analytics not supported in this environment:", err);
  });
}

export const googleProvider = new GoogleAuthProvider();

export default app;
