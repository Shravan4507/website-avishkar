# Technical Specification: Avishkar '26

## 🗄️ Database Schema (Firestore)

| Collection | Description | Key Fields |
|------------|-------------|------------|
| `registrations` | Confirmed event participations. | `registrationId`, `userUID`, `eventID`, `status: confirmed` |
| `pending_registrations` | Temporary storage for active transactions. | `txnid`, `type`, `finalPayload`, `status: pending` |
| `users` | User profiles and registration metadata. | `uid`, `displayName`, `email`, `role`, `userAVR` |
| `ps_metadata` | Problem statement tracking (counts, categories). | `count`, `category` |
| `counters` | Atomically incremented ID counters. | `count` |
| `mail` | Queue for the Trigger Email extension. | `to`, `message: { subject, html }` |

## ⚡ Backend Logic (Cloud Functions)

### 1. `onRegistrationCreated` (Trigger)
- **Action**: Runs whenever a new document is added to `registrations/`.
- **Logic**: Reads an HTML template, generates a QR code URL from `api.qrserver.com`, and queues confirmation/invoice emails in the `mail/` collection.

### 2. `initiatePayment` (HTTPS)
- **Action**: Called by the frontend to start a transaction.
- **Security**: Generates a SHA-512 hash using the Easebuzz Secret & Salt stored in Firebase Secrets.
- **Return**: Sends an `access_key` back to the frontend for the checkout overlay.

### 3. `paymentWebhook` (HTTPS Callback)
- **Action**: Receives POST from Easebuzz after a transaction.
- **Verification**: Recalculates the "Reverse Hash" to verify authenticity.
- **Atomicity**: Uses `admin.firestore().runTransaction()` to atomically update counters, set registration IDs (e.g., `AVR-PRM-0001`), and mark the transaction as confirmed.

## 🔒 Security Architecture

### 1. QR Integrity
- **Algorithm**: HMAC-SHA256.
- **Implementation**: The participant ID (`userAVR`) is hashed with a secret key. The scanner compares the locally computed hash with the QR payload.

### 2. Route Guards
- **UserProtectedRoutes**: Redirects unauthenticated users to `/login`.
- **AdminProtectedRoutes**: Checks the user's Firestore `role` field. Only `admin` or `superadmin` can pass.

## 🚀 Performance Utilities

- **`isLowSpecDevice`**: Detects slow hardware (less than 4 cores or < 4GB RAM) to disable heavy WebGL/Canvas effects.
- **`reportError`**: Centralized logging system that captures severity and component-level context for all app failures.
