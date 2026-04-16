# Admin Guide: Role-Based Management

## 👥 Roles & Permissions

The platform uses a strict Role-Based Access Control (RBAC) system.

| Role | Dashboard Visibility | Permissions |
|------|----------------------|-------------|
| **Superadmin** | Global | Full control over all departments, roles, and financials. |
| **Core Team** | Overview | Access to global stats and registration logs. |
| **Department Admin** | Department-Specific | Manage events within their own department (e.g., "Web/App"). |
| **Volunteer** | Scanner-Only | Access to the camera-based attendance system. |

## 📊 Admin Dashboard Structure

The Admin Panel (`/admin/dashboard`) is divided into several modules:

### 1. Registration Manager
- **Live Search**: Filter by Transaction ID, Leader Name, or AVR-ID.
- **Export**: One-click Excel (`.xlsx`) export for all registration data.

### 2. Manual Registration (Wizard)
- **Offline Entry**: Allows admins to register participants who paid in cash or at the venue.
- **Auto-Validation**: Checks for existing registrations to prevent duplicates.

### 3. Competition Analytics
- Displays bar charts of registration counts per event.
- Identifies "Flagship" vs. "Minor" event performance metrics.

## 📋 Standard Workflows

### Manual Registration Process
1. Navigate to **Manual Registration** in the sidebar.
2. Select the **Department** and **Event**.
3. Fill in participant details (Name, College, Phone, Email).
4. Select **Payment Status** (Paid/Pending).
5. Submit — The system generates a standard `AVR-ID` and sends an invoice email.

### Attendance Tracking
- Volunteers use the **Scanner** module (`/user/scanner`).
- QR codes are decrypted in real-time.
- Attendance status (`isAttended: true`) is updated instantly in Firestore.
