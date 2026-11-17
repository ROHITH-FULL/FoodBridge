# FoodBridge — Connecting Surplus Food to Those Who Need It

> **Tagline:** *"From Food Waste to Food for All."*  
> **Category:** Full-Stack Social-Impact Technology / Surplus Food Recovery Platform  
> **Status:** Student Innovation Prototype for IDE Boot Camp

---

## 1. Project Overview & Problem Statement

Usable surplus food is frequently generated at weddings, banquets, corporate summits, college fests, and catering events. Event organizers and hosts often struggle to estimate surplus accurately, discover verified local charities, and coordinate safe transportation before meals deteriorate. At the same time, verified food banks, shelters, and relief charities face severe food deficits but lack real-time visibility into available surpluses.

**FoodBridge** provides an end-to-end digital coordination bridge between food donors (event organizers, caterers) and verified receiving organizations (NGOs, shelters, food banks).

> [!NOTE]
> **Research Context:** The assumptions regarding food waste causes and recovery challenges are working hypotheses for this prototype. Fictional sample data is clearly tagged as **DEMO DATA** to maintain scientific and social integrity.

---

## 2. Main Objectives

1. **Surplus Registration:** Record food category, weight in kg, servings, preparation timestamp, safe storage method, and pickup deadlines.
2. **Rule-Based Smart Matching:** Deterministically match and rank receiving organizations by verification status, vehicle capacity, geographic area, and timeline feasibility without third-party AI dependencies.
3. **Food Safety Enforcement:** Apply conservative eligibility checks (such as 4-hour hot-holding alerts based on WHO/FSSAI benchmarks), mandatory donor declarations, and incident dispute channels.
4. **Closed-Loop Verification:** Prevent race conditions on concurrent claims, verify physical handover with a pickup confirmation code, and record actual collected and handed-over weights separately from listed volumes.
5. **Honest Impact Accounting:** Deliver an interactive impact dashboard where only verified, completed handovers count toward meals shared, distinguishing demo records from live operational statistics.

---

## 3. Technology Stack

- **Frontend:**
  - React.js (v18)
  - Vite (v6)
  - React Router (v6)
  - Lucide React icons
  - Custom CSS Design System (Forest Green `#1B4D3E`, Emerald `#10B981`, and neutral theme)
- **Backend:**
  - Node.js (v24)
  - Express.js REST API
  - Native Node.js `node:sqlite` (`DatabaseSync`) for zero-dependency, crash-free Windows persistence
  - `bcryptjs` for secure salted password hashing
  - `jsonwebtoken` (JWT) for stateless bearer authentication
  - CORS middleware & input validators
- **Testing:**
  - Node.js built-in test runner (`node --test`) with 23 comprehensive automated integration tests

---

## 4. System Architecture

```text
+---------------------------------------------------------------------------------+
|                               CLIENT (React + Vite)                             |
|  - Landing Page               - Available Food Gallery    - Food Safety Guide   |
|  - Auth & Demo Switcher       - Smart Matching Engine     - Impact Analytics    |
|  - Organizer Dashboard        - NGO Dashboard             - Admin Panel         |
+----------------------------------------+----------------------------------------+
                                         | HTTP / REST (JWT Bearer Auth)
                                         v
+---------------------------------------------------------------------------------+
|                           SERVER (Node.js + Express API)                        |
|  - /api/auth       (Register, Login, 1-Click Demo Login, /me)                   |
|  - /api/food       (Create, Query, Update, Cancel, Eligibility Checks)          |
|  - /api/matches    (Rule-based Proximity, Capacity & Verification Scoring)       |
|  - /api/requests   (Atomic Claim, Schedule, Pickup Code Verification, Handover) |
|  - /api/organizations (Profiles, Admin NGO Verification Queue)                  |
|  - /api/dashboard  (Organizer, NGO, Admin, Impact Metrics & CSV Export)         |
|  - /api/reports    (Safety Concerns, Incident Reports, Admin Resolutions)       |
+----------------------------------------+----------------------------------------+
                                         | Parameterized SQL Transactions
                                         v
+---------------------------------------------------------------------------------+
|                       DATABASE (SQLite - data/foodbridge.db)                    |
|  [users]                   [organizations]               [food_listings]        |
|  [donation_requests]       [status_history]              [org_verifications]    |
|  [reports]                                                                      |
+---------------------------------------------------------------------------------+
```

---

## 5. Database Schema

The SQLite schema utilizes foreign keys (`PRAGMA foreign_keys = ON;`), relational integrity checks, and indexing:

1. **`users`**: `id`, `full_name`, `email` (unique), `mobile`, `password_hash`, `role` (`ORGANIZER` | `NGO` | `ADMIN`), `created_at`.
2. **`organizations`**: `id`, `user_id` (FK), `organization_name`, `registration_details`, `address`, `city`, `postal_code`, `collection_capacity_kg`, `availability_information`, `verification_status` (`PENDING` | `VERIFIED` | `REJECTED`).
3. **`food_listings`**: `id`, `organizer_id` (FK), `title`, `category`, `description`, `quantity_kg`, `estimated_servings`, `preparation_time`, `dietary_type`, `storage_information`, `address`, `area`, `city`, `postal_code`, `pickup_deadline`, `contact_person`, `contact_phone`, `safety_declaration`, `eligibility_status` (`ELIGIBLE` | `FLAGGED`), `listing_status` (`AVAILABLE` | `CLAIMED` | `COMPLETED` | `CANCELLED`), `is_demo`.
4. **`donation_requests`**: `id`, `food_listing_id` (FK), `organization_id` (FK), `request_status` (`ACCEPTED` | `PICKUP_SCHEDULED` | `COLLECTED` | `HANDED_OVER` | `CANCELLED` | `REJECTED`), `pickup_confirmation_code`, `collected_quantity_kg`, `handed_over_quantity_kg`, `scheduled_pickup_time`, `is_demo`.
5. **`status_history`**: `id`, `request_id` (FK), `previous_status`, `new_status`, `changed_by` (FK), `timestamp`, `notes`.
6. **`organization_verifications`**: `id`, `organization_id` (FK), `review_status`, `reviewer_id` (FK), `review_notes`, `reviewed_at`.
7. **`reports`**: `id`, `reporter_id` (FK), `listing_id` (FK), `request_id` (FK), `reason`, `details`, `report_status` (`PENDING` | `RESOLVED`), `created_at`.

---

## 6. Installation & Quick Start

### Prerequisites
- Node.js **v20+** or **v24+** (recommended)
- npm (v10+ or v11+)

### 1. Clone or Open Workspace
```powershell
cd "c:\food bridge"
```

### 2. Environment Configuration
The repository includes `.env.example`. Environment settings are pre-configured:
```powershell
# Copy if not already created:
cp server/.env.example server/.env
```

### 3. Initialize & Seed Database
```powershell
npm run seed
```
This initializes the SQLite tables in `server/data/foodbridge.db` and populates realistic demo accounts, sample listings, and past handovers.

### 4. Start the Application
Run both backend (port 5000) and frontend (port 5173) with a single command:
```powershell
npm run dev
```

Alternatively, run in separate terminal windows:
- **Backend:** `npm run dev:server`
- **Frontend:** `npm run dev:client`

Open your web browser at:
**[http://localhost:5173](http://localhost:5173)**

---

## 7. Pre-Configured Demo Accounts

For IDE Boot Camp evaluations and live demonstrations, use the **1-Click Role Switcher bar** at the top of the interface or log in manually:

| Role | Name | Email | Password | Status / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Platform Administrator | `admin@foodbridge.org` | `admin123` | Full access to NGO approvals, reports & demo reset |
| **Organizer (Donor)** | Anita Sharma | `organizer@foodbridge.org` | `organizer123` | Grand Palace Events (Wedding host) |
| **Catering Donor** | Marcus Vance | `catering@foodbridge.org` | `catering123` | Apex Corporate Catering |
| **Verified NGO** | Hope Community Food Bank | `ngo.hope@foodbridge.org` | `ngo123` | Verified food relief bank (Capacity: 150 kg) |
| **Verified NGO 2** | Harbor Relief Shelter | `ngo.shelter@foodbridge.org` | `ngo123` | Verified emergency shelter (Capacity: 80 kg) |
| **Pending NGO** | New Dawn Youth Mission | `ngo.new@foodbridge.org` | `ngo123` | Unverified NGO (Awaiting admin approval) |

---

## 8. Demonstration Walkthrough (< 5 Minutes)

Follow this presentation scenario:

1. **Donor Step (Organizer):**
   - Click **Organizer (Anita)** on the top demo banner.
   - Click **List Food**. Submit a listing:
     - Title: *"Grand Reception Veg Biryani"*
     - Category: `Cooked meals`, Quantity: `30 kg`
     - Storage: *"Insulated hot boxes above 60°C"*
     - Accept the Food Safety Declaration checkbox and submit.
   - From the Organizer Dashboard, click **Matches** next to the listing to observe the transparent rule-based compatibility ranking.

2. **Claim Step (Verified NGO):**
   - Click **Verified NGO (Hope)** on the top demo banner.
   - Navigate to **Available Food** or **NGO Dashboard**.
   - Locate the newly listed food and click **Claim Food**.
   - The system executes an atomic transaction, generating a unique pickup confirmation code (e.g. `FB-XXXX`).

3. **Coordination & Collection Step:**
   - In the Request Management view, click **Confirm Pickup Schedule** to set an arrival window.
   - When the food is handed over, enter the **Pickup Confirmation Code** and the **Actual Collected Weight** (e.g. `30.0 kg`).
   - Click **Verify Code & Confirm Collection**. Status updates to `COLLECTED`.

4. **Handover to Beneficiaries Step:**
   - Enter the final redistributed quantity (e.g. `30.0 kg`) and click **Mark Handover Complete**.
   - Status updates to `HANDED_OVER` and listing completes.

5. **Impact Verification Step:**
   - Visit the **Impact Dashboard**.
   - Verify that the total kilograms handed over and meal portions served immediately reflect the newly completed distribution.
   - Toggle between **Live Sessions Only** and **All Records (Demo & Live)** to review honest accounting.
   - Click **Export CSV** to download the audit log.

6. **Admin Verification Step:**
   - Click **Admin** on the top demo banner.
   - Visit the **Organization Verification Queue**.
   - Click **Approve** on `New Dawn Youth Mission` to grant them verified claiming status.

---

## 9. Rule-Based Smart Matching Algorithm

Matching does not require paid external AI or mapping APIs. It deterministically computes a 100-point compatibility score:

$$\text{Score} = S_{\text{verification}} + S_{\text{capacity}} + S_{\text{location}} + S_{\text{deadline}} + S_{\text{operating}}$$

- **Organization Verification (35 pts):** Verified relief agencies receive 35 points; unverified receive 0 (and are prevented from claiming live food).
- **Receiver Capacity (25 pts):** Capacity $\ge$ volume awards 25 pts; capacity $\ge 70\%$ awards 15 pts; below volume awards 5 pts.
- **Location Proximity (25 pts):** Same postal code awards 25 pts; same municipal city awards 15 pts; external areas receive 0 pts.
- **Deadline Feasibility (10 pts):** Over 3 hours remaining awards 10 pts; 1–3 hours awards 5 pts; $<1$ hour awards 0 pts.
- **Active Operating Window (5 pts):** Confirmed active collection hours award 5 pts.

---

## 10. REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register donor or NGO account
- `POST /api/auth/login` — Login with email and password
- `POST /api/auth/demo-login` — 1-Click login for prototype evaluation
- `GET /api/auth/me` — Retrieve active authenticated user profile

### Food Listings (`/api/food`)
- `GET /api/food` — Browse available surplus food (supports `category`, `city`, `min_quantity`, `search`)
- `GET /api/food/my-listings` — View listings created by authenticated organizer
- `GET /api/food/:id` — View detailed listing and associated requests
- `POST /api/food` — Create food listing (requires `ORGANIZER` or `ADMIN`)
- `PUT /api/food/:id` — Update available listing
- `POST /api/food/:id/cancel` — Cancel listing with reason

### Smart Matching (`/api/matches`)
- `GET /api/matches/listing/:id` — Rank receiving NGOs for a specific listing
- `GET /api/matches/ngo` — Rank available listings for current NGO

### Requests & Handover (`/api/requests`)
- `POST /api/requests/accept` — Atomic claim by verified NGO (generates pickup code)
- `GET /api/requests/:id` — View request status, timeline, and parties
- `POST /api/requests/:id/schedule` — Schedule vehicle arrival time
- `POST /api/requests/:id/confirm-pickup` — Verify pickup code and record collected kg
- `POST /api/requests/:id/complete-handover` — Complete distribution and record handed-over kg
- `POST /api/requests/:id/cancel` — Cancel active request and reopen listing

### Organizations (`/api/organizations`)
- `GET /api/organizations/me` — Current NGO profile and verification history
- `PUT /api/organizations/me` — Update organization details
- `GET /api/organizations` — List organizations (with `status` filter)
- `PATCH /api/organizations/:id/verification` — Approve or reject NGO (`ADMIN` only)

### Dashboards & Impact (`/api/dashboard`)
- `GET /api/dashboard/organizer` — Personal counts and active pickups
- `GET /api/dashboard/ngo` — Personal pickups and nearby surplus
- `GET /api/dashboard/admin` — System overview and verification queue
- `GET /api/dashboard/impact` — Public impact metrics (with `dataScope=all|live_only`)
- `GET /api/dashboard/impact/export-csv` — Download CSV report
- `POST /api/dashboard/admin/reset-demo` — Reset database to clean initial baseline

### Safety & Incident Reports (`/api/reports`)
- `POST /api/reports` — Submit dispute or safety concern
- `GET /api/reports` — View all submitted reports (`ADMIN` only)
- `PATCH /api/reports/:id/status` — Update resolution status (`ADMIN` only)

---

## 11. Automated Testing Suite

To execute the automated backend test suite:
```powershell
npm test
```

### Coverage (23 Automated Integration Tests):
1. **Health & Auth API:** Health check, valid login JWT generation, invalid password rejection (401), registration with password hashing, duplicate account rejection (409), 1-click demo login.
2. **Food Validation:** Past deadline rejection (400), unsigned safety declaration rejection (400), valid listing creation with `ELIGIBLE` status.
3. **Smart Matching:** Multi-factor scoring verification, capacity check, location match, unverified NGO deduction.
4. **Request Lifecycle & Integrity:** Unverified NGO claim rejection (403), verified NGO claim with pickup code generation, concurrent race-condition prevention, pickup scheduling, invalid pickup code rejection (400), valid code collection verification, handover completion with weight accounting.
5. **Admin & Impact Analytics:** Unauthorized admin access rejection (403), admin dashboard metrics, dynamic NGO verification approval, honest impact calculation, CSV export format validation.

---

## 12. Known Limitations & Future Enhancements

### Prototype Considerations
- **GPS Coordinates:** Local demo uses structured areas and postal codes. Precision GPS routing can be integrated with OpenStreetMap/Leaflet in future revisions.
- **Physical Verification:** The platform enforces strict digital hygiene declarations and pickup confirmation codes; on-site sensory inspection remains essential.

### Planned Enhancements
- Automated SMS alerts to volunteer drivers when a high-match surplus listing is registered nearby.
- AI-assisted surplus prediction for event planners based on headcount and banquet menu types.
- Dedicated mobile application built with Flutter for on-site barcode/QR scanning.
- Cold-chain IoT temperature sensor telemetry logging during transit.

---

## 13. License

Distributed under the MIT License for educational and social-impact purposes.
