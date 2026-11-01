# CloudMesh — AI-Powered Community Resource Exchange & Emergency Response Platform

> **Tagline:** “Connecting Communities. Sharing Resources. Responding Together.”

CloudMesh is a full-stack, mobile-first community mutual aid platform built with **React**, **Vite**, **Tailwind CSS**, and the **Firebase Modular JavaScript SDK (v11+)**. It empowers neighborhoods to coordinate aid, pool critical supplies (food, potable water, medical supplies, emergency shelter, power generators), and dispatch volunteer responders during local crises and extreme weather events.

---

## 1. Application Architecture & File Structure

```
├── .env.example                # Environment variables template
├── firebase.json               # Firebase CLI hosting, rules, and emulator config
├── firestore.indexes.json      # Cloud Firestore composite indexes
├── firestore.rules             # Production least-privilege security rules
├── index.html                  # SEO-optimized HTML entry point with Inter font
├── package.json                # Project dependencies and npm scripts
├── vite.config.js              # Vite bundler configuration with Tailwind CSS plugin
├── src/
│   ├── main.jsx                # React root mount
│   ├── App.jsx                 # Main application coordinator with modal managers
│   ├── index.css               # Design tokens, typography, and scrollbar styling
│   ├── lib/
│   │   └── firebase.js         # Single Firebase modular SDK initialization & config
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication context, session observer, and RBAC
│   ├── services/
│   │   ├── authService.js      # Firebase Auth login, registration, password reset
│   │   ├── userService.js      # User profiles, role promotion, account status
│   │   ├── resourceService.js  # Resource listing CRUD, search, filter, pagination
│   │   ├── requestService.js   # Request lifecycle, inventory reduction, notifications
│   │   ├── emergencyService.js # Incident dispatch, responder triage logs, live feed
│   │   ├── notificationService.js # In-app notifications & real-time snapshot sync
│   │   ├── aiService.js        # Natural language triage, smart matching, duplicate detection
│   │   └── localStore.js       # Persistent storage fallback with rich seed data
│   ├── components/
│   │   ├── Navbar.jsx          # Header with persona switcher and Firebase badge
│   │   ├── Footer.jsx          # Official 911/112 disclaimers and emergency links
│   │   ├── Toast.jsx           # Animated contextual alert notifications
│   │   ├── RoleBadge.jsx       # Visual role indicator (Admin, Responder, Citizen)
│   │   ├── EmergencyBanner.jsx # Top critical incident broadcast alert
│   │   ├── NotificationDropdown.jsx # Real-time unread notifications drawer
│   │   ├── FirebaseStatusModal.jsx # Live connection status & setup assistant
│   │   ├── AuthModal.jsx       # Login, registration, password reset, demo accounts
│   │   ├── OfferResourceModal.jsx   # Create & edit supply listings
│   │   ├── RequestResourceModal.jsx # Request resource workflow with quantity checks
│   │   ├── ReportEmergencyModal.jsx # Incident report with live AI severity triage
│   │   └── IncidentDetailModal.jsx  # Responder dispatch, logs, & AI resource matching
│   └── pages/
│       ├── DashboardPage.jsx   # Community metrics, active alerts, quick actions
│       ├── ResourcesPage.jsx   # Searchable, filterable community resource catalog
│       ├── EmergencyPage.jsx   # Incident triage board, map view, and 911 directory
│       ├── ProfilePage.jsx     # Personal profile, my listings, and request decision center
│       └── AdminPage.jsx       # RBAC controls, responder operations, user management
```

---

## 2. Quick Start & Local Development

### Prerequisites
- Node.js `v18+` or `v20+` or `v22+`
- npm `v9+` or `v10+`

### Installation & Execution
```bash
# 1. Clone repository and navigate to root
cd d:/Rithaya

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

> **Zero-Configuration Mode:** If you do not have Firebase keys right away, CloudMesh automatically runs in **Local Persistence Mode** using `localStorage` and pre-seeded community data. Every feature (user accounts, offering supplies, requesting items, approving requests, submitting emergencies, triaging incidents) works persistently!

---

## 3. Step-by-Step Firebase Integration Guide

### Step 1: Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** (or **"Create a project"**).
3. Name your project (e.g., `cloudmesh-community`).
4. Choose whether to enable Google Analytics (optional, can be disabled), then click **"Create project"**.

### Step 2: Set Up Firebase Authentication
1. In the Firebase Console left sidebar, click **"Build"** > **"Authentication"**.
2. Click **"Get started"**.
3. Under the **"Sign-in method"** tab, select **"Email/Password"**.
4. Toggle **"Enable"** (leave "Email link / passwordless" disabled) and click **"Save"**.

### Step 3: Set Up Cloud Firestore
1. In the left sidebar, click **"Build"** > **"Firestore Database"**.
2. Click **"Create database"**.
3. Choose a Firestore location close to your community (e.g., `nam5 (us-central)` or `eur3 (europe-west)`).
4. Select **"Start in production mode"** (our `firestore.rules` will secure it) and click **"Create"**.

### Step 4: Obtain Web App Configuration Keys
1. In the Firebase Console, click the **Gear Icon ⚙️** next to *Project Overview* > **"Project settings"**.
2. Scroll down to the **"Your apps"** section and click the **Web icon `</>`**.
3. Register app name: `CloudMesh Web` (Firebase Hosting setup is optional).
4. Click **"Register app"**.
5. Firebase will display `firebaseConfig = { ... }`. Copy these values into a new `.env` file in your workspace:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=cloudmesh-community.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cloudmesh-community
VITE_FIREBASE_STORAGE_BUCKET=cloudmesh-community.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef...
```

6. Restart the Vite dev server (`npm run dev`). CloudMesh will detect the keys and connect live to Cloud Firestore!

---

## 4. Deploying Firestore Security Rules and Indexes

Deploy rules and composite indexes to your live Firebase project using the Firebase CLI:

```bash
# 1. Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# 2. Log in to your Google Account
firebase login

# 3. Associate with your Firebase project
firebase use --add

# 4. Deploy Firestore Rules and Indexes
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 5. Security Rules Architecture

CloudMesh implements strict **Least Privilege** in `firestore.rules`:

| Collection | Read Policy | Write / Create Policy | Update / Delete Policy |
| :--- | :--- | :--- | :--- |
| `users` | Authenticated users | Authenticated (only self) | Only self for profile info; **Role & Status changes locked to Admins** |
| `resources` | Public read | Authenticated users | **Only listing owner** or Admin |
| `resourceRequests` | Requester, Owner, Admin | Authenticated (non-owner) | Requester can cancel; **Owner can accept/reject/complete**; Admin |
| `emergencyReports` | Public read for safety | Authenticated or Public | **Only verified Responders & Admins** can update status / dispatch |
| `notifications` | Recipient user only | Authenticated | **Recipient only** (mark as read) |

---

## 6. Firestore Data Model Reference

### `users/{userId}`
- `uid`: String (Firebase Auth UID)
- `displayName`: String
- `email`: String
- `phone`: String (Optional)
- `location`: String (Neighborhood/Ward)
- `role`: `'user' | 'responder' | 'admin'`
- `status`: `'active' | 'suspended'`
- `bio`: String
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### `resources/{resourceId}`
- `title`: String
- `description`: String
- `category`: `'food' | 'water' | 'clothing' | 'shelter' | 'medical' | 'transportation' | 'equipment' | 'other'`
- `quantity`: Number
- `unit`: String (e.g., `cases`, `kits`, `meals`, `boxes`)
- `availability`: `'available' | 'reserved' | 'partially_available' | 'unavailable'`
- `location`: String
- `ownerId`: String (User UID)
- `ownerName`: String
- `ownerContact`: String
- `urgent`: Boolean
- `expiryDate`: ISO Date / Timestamp
- `createdAt`: Timestamp

### `resourceRequests/{requestId}`
- `resourceId`: String
- `resourceTitle`: String
- `ownerId`: String
- `ownerName`: String
- `requesterId`: String
- `requesterName`: String
- `requestedQuantity`: Number
- `neededByDate`: String
- `notes`: String
- `status`: `'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'`
- `decisionNotes`: String
- `createdAt`: Timestamp

### `emergencyReports/{reportId}`
- `title`: String
- `description`: String
- `category`: `'medical' | 'flood_storm' | 'fire' | 'structural' | 'utility_outage' | 'search_rescue' | 'supplies_food' | 'other'`
- `location`: String
- `severity`: `'critical' | 'high' | 'medium' | 'low'`
- `immediateDanger`: Boolean
- `status`: `'reported' | 'verified' | 'assigned' | 'in_progress' | 'resolved' | 'rejected'`
- `reporterId`: String (or `'anonymous'`)
- `reporterName`: String
- `assignedTo`: String | null
- `assignedToName`: String | null
- `responderNotes`: String
- `timestamp`: Timestamp

### `notifications/{notificationId}`
- `userId`: String (Recipient UID)
- `title`: String
- `message`: String
- `type`: `'request_received' | 'request_update' | 'emergency_alert' | 'system'`
- `link`: String
- `read`: Boolean
- `createdAt`: Timestamp

---

## 7. AI-Ready Architecture

CloudMesh features an intelligent client-side triage and matching engine in `src/services/aiService.js`:

1. **Real-Time Emergency NLP Triage**: Analyzes text patterns as citizens describe incidents, detecting critical danger tokens (e.g., *"trapped"*, *"cardiac"*, *"downed power lines"*, *"water rising"*) to recommend urgency ratings (`critical`, `high`, `medium`, `low`) and hazard classifications.
2. **Smart Emergency-to-Supply Matcher**: Automatically correlates reported hazards with active neighborhood supplies (e.g., matching a power outage with portable generators or trauma reports with first aid kits).
3. **Duplicate Report Detector**: Evaluates text similarity and location proximity to identify potential duplicate dispatches, preventing redundant responder trips.
4. **Google Gemini Integration**: Ready to connect via `VITE_GEMINI_API_KEY` for high-volume automated incident summarization and multi-lingual voice-to-text dispatch.

---

## 8. Built-in Persona & Role Testing

To facilitate effortless testing of all role permissions, CloudMesh includes a **one-click persona switcher** in the top navigation bar and Auth modal:

1. **Elena Rostova (`Admin`)**: Can promote/demote user roles, suspend accounts, delete listings, and oversee all system records.
2. **Marcus Chen, EMT (`Responder`)**: Can verify emergency incidents, assign responders to field missions, and record responder tactical logs.
3. **Sarah Miller (`Citizen`)**: Can offer resources, request items, manage received requests (approve/decline), and report neighborhood emergencies.

---

## 9. Official Emergency Services Disclaimer

> **IMPORTANT:** CloudMesh is an open mutual-aid coordination platform. It is **NOT** a replacement for governmental 911/112 emergency services. In the event of immediate danger to life or property, contact local emergency dispatch (911 / 112 / 999) immediately.
