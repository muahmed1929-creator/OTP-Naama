# 🤖 Agents Configuration for OTP SaaS Project (RBAC Enabled)

## 🎯 Goal

Build a scalable OTP SaaS platform with:

* OTP generation (manual + automatic)
* Panel API integration (4 panels)
* Redis-based caching
* Queue-based processing
* Analytics dashboard (24h, weekly, monthly)
* 🔐 Admin-controlled access + employee users

---

## 👤 User Roles (IMPORTANT)

### 1. Admin (Super User)

* Full system access
* Can:

  * Generate OTP
  * View dashboard
  * Manage panels
  * View logs
  * Create / update / delete employees
  * Generate & revoke API keys

### 2. Employee (Limited User)

* Restricted access
* Can:

  * Generate OTP (manual only OR as allowed)
  * View limited dashboard
* Cannot:

  * Manage panels
  * Access API keys
  * Delete logs
  * Change system settings

---

## 🧠 Agent 1: System Architect

### Role:

Design system architecture with role-based access.

### Responsibilities:

* Define RBAC system
* Ensure separation of concerns
* Plan scalable structure (10k OTP/day)
* Define permission layers

### Rules:

* Every API must check role permissions
* Use middleware for access control
* Avoid tight coupling

---

## ⚙️ Agent 2: Backend Engineer

### Role:

Build Fastify backend with RBAC.

### Responsibilities:

* OTP generation service
* Redis integration (TTL-based OTP storage)
* BullMQ queue setup
* Panel API integration
* Role-based authentication system
* Admin creates employees
* API key system (admin only)

### Auth System:

* Simple login (email + password)
* Session or JWT-based auth

### RBAC Middleware:

* Check:

  * isAdmin
  * isEmployee
  * permissions

### Endpoints:

#### Auth:

* POST /auth/login
* POST /auth/create-employee (admin only)

#### OTP:

* POST /otp/generate
* POST /otp/auto-toggle (admin only)

#### Dashboard:

* GET /dashboard/stats

#### Panels:

* POST /panels (admin only)
* GET /panels

#### Logs:

* GET /logs

### Rules:

* Protect all routes
* Employees must have limited access
* Use middleware for role validation

---

## 🎨 Agent 3: Frontend Engineer

### Role:

Build role-based dashboard UI.

### Responsibilities:

* Admin dashboard (full access)
* Employee dashboard (restricted view)
* Login page
* User management UI (admin only)

### Pages:

#### Public:

* Login

#### Admin:

* Dashboard
* OTP Logs
* Panels Management
* Employee Management

#### Employee:

* Dashboard (limited)
* OTP Generate page

### Rules:

* Hide restricted UI for employees
* Use role-based rendering

---

## 🗄️ Agent 4: Database Engineer

### Role:

Design RBAC-enabled schema.

### Tables:

#### users

* id
* name
* email
* password_hash
* role (admin / employee)
* created_at

#### api_keys

* id
* key
* created_by (admin)

#### panels

* id
* name
* api_url
* api_key

#### otps

* id
* otp_code
* area
* panel_id
* status
* created_by (user_id)
* created_at
* expires_at

#### logs

* id
* otp_id
* panel_id
* response
* status
* timestamp

### Rules:

* Index role & created_at
* Maintain relations

---

## 🔄 Agent 5: Queue & Performance Engineer

### Role:

Handle background jobs.

### Responsibilities:

* Auto OTP generation (admin-controlled)
* Queue processing
* Retry logic

### Rules:

* Only admin can enable auto mode
* Queue must not expose sensitive data

---

## 🔐 Agent 6: Security Engineer

### Role:

Secure RBAC system.

### Responsibilities:

* Password hashing (bcrypt)
* Role validation middleware
* Rate limiting
* Secure sessions/JWT

### Rules:

* No plaintext passwords
* Validate roles on every request
* Protect admin routes strictly

---

## 🚀 Agent 7: DevOps Engineer

### Role:

Prepare deployment.

### Responsibilities:

* Environment setup
* Secrets management
* Build instructions

---

## 🧪 Agent 8: QA Engineer

### Role:

Test RBAC + system flows.

### Test Cases:

* Admin login & full access
* Employee restricted access
* OTP generation by both roles
* Admin creates employee
* Employee cannot access admin routes
* Auto OTP only works if enabled by admin

---

## 🔁 Workflow

1. Architect defines RBAC structure
2. Backend implements auth + roles
3. DB schema updated
4. Queue system integrated
5. Frontend builds role-based UI
6. Security enforced
7. QA tests role restrictions
8. DevOps prepares deployment

---

## ⚠️ Global Rules

* Role-based access must be enforced everywhere
* No endpoint should be publicly accessible
* Use environment variables
* Write production-level modular code
* Avoid hardcoding roles/permissions

---

## 🎯 Final Output

* OTP SaaS with Admin + Employee system
* Secure authentication
* Role-based dashboard
* Scalable architecture
