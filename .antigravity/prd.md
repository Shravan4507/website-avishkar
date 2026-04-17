# Product Requirement Document (PRD): Avishkar '26

## 🎯 Objective
To provide a seamless, secure, and futuristic digital gateway for Avishkar '26 participants, volunteers, and organizers.

## 👤 User Roles & Personas

| Role | Access Level | Primary Task |
|------|--------------|--------------|
| **Student** | Public / Auth | Browse events, Register, View QR Pass. |
| **Volunteer** | User Protected | Scan QR passes at event entry (Offline-ready). |
| **Admin** | Admin Protected | Manage specific department registrations. |
| **Superadmin** | Full Access | Global dashboard, Role assignment, Financial audits. |

## 🌟 Core Features

### 1. Registration & Payment
- **Race-Condition-Proof**: Uses Firebase transactions for payment confirmations.
- **Easebuzz Integration**: SHA-512 hash-verified transactions via Cloud Functions.
- **Dynamic Fees**: Automatic fee calculation based on competition type (Standard vs. Team).

### 2. Digital Identity (QR Pass)
- **Virtual ID Card**: Generated on registration, accessible via User Dashboard.
- **Security**: HMAC-SHA256 signing of the AVR-ID to prevent spoofing.
- **Accessibility**: One-click download as PNG/PDF.

### 3. Admin Dashboard (RBAC)
- **Multi-Level Access**: Department-specific visibility.
- **Manual Registration**: Allows admins to register participants manually for on-spot events.
- **Real-time Analytics**: Tracking registration counts per competition.

### 4. Technical Resilience
- **Offline Scanner**: IndexedDB persistence for volunteers scanning in low-network areas.
- **SEO Optimization**: Open Graph tags for social sharing and JSON-LD for event discoverability.
