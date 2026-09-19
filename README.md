# Freelance Marketplace Platform (FreelanceHub)

A complete, production-ready full-stack web application for a **Freelance Marketplace Platform** featuring three distinct user roles (Client, Freelancer, Admin), Microsoft SQL Server 2025 database integration, Express.js REST APIs, and a modern, responsive HTML5/CSS3/Vanilla JavaScript frontend served directly by Express.

---

## Architecture Overview

```
FreelanceMarketplace/
├── database/
│   └── FreelanceMarketplaceDB.sql   # Complete SQL schema, constraints, indexes & seeds
├── backend/
│   ├── config/
│   │   └── db.js                    # MSSQL connection pool (Windows & SQL Auth)
│   ├── controllers/
│   │   ├── authController.js        # Register, login, profile, JWT token generation
│   │   ├── projectController.js     # Project CRUD, filtering, search, client view
│   │   ├── applicationController.js # Proposal bidding, client accept/reject workflow
│   │   └── adminController.js       # Platform analytics, user moderation, audit
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification and active user checks
│   │   └── roleMiddleware.js        # Role-based authorization ('Client', 'Freelancer', 'Admin')
│   ├── routes/
│   │   ├── authRoutes.js            # /api/auth endpoints
│   │   ├── projectRoutes.js         # /api/projects endpoints
│   │   ├── applicationRoutes.js     # /api/applications endpoints
│   │   └── adminRoutes.js           # /api/admin endpoints
│   ├── .env.example                 # Environment template
│   ├── .env                         # Active configuration
│   ├── package.json                 # Dependencies & scripts
│   └── server.js                    # Express application & static frontend server
├── frontend/
│   ├── css/
│   │   └── style.css                # Pure CSS3 responsive design system
│   ├── js/
│   │   ├── auth.js                  # Token storage, dynamic navbar, route protection, toasts
│   │   ├── projects.js              # Catalog browsing, search, filter, project details
│   │   ├── client.js                # Client dashboard, post project, evaluate proposals
│   │   ├── freelancer.js            # Freelancer dashboard, my applications, bid submission
│   │   └── admin.js                 # Admin dashboard, user and project management
│   ├── index.html                   # Landing page
│   ├── login.html                   # Login page with 1-click test credentials
│   ├── register.html                # Signup for Client or Freelancer
│   ├── projects.html                # Public project browse catalog
│   ├── project-details.html         # Project details & apply CTA
│   ├── client-dashboard.html        # Client portal overview
│   ├── create-project.html          # Post or edit project form
│   ├── client-applications.html     # Client proposal review & accept/reject
│   ├── freelancer-dashboard.html    # Freelancer portal overview
│   ├── my-applications.html         # Freelancer proposal tracker
│   ├── apply-project.html           # Freelancer submit proposal form
│   ├── admin-dashboard.html         # Admin analytics dashboard
│   ├── manage-users.html            # Admin user accounts moderation
│   ├── manage-projects.html         # Admin project moderation
│   └── manage-applications.html     # Admin proposal moderation
├── .gitignore                       # Git ignore file
└── README.md                        # Documentation & setup guide
```

---

## Technology Stack

- **Frontend**: HTML5, Modern CSS3 (Custom Properties, Flexbox, CSS Grid), Vanilla JavaScript ES6+ (No React/Bootstrap/Tailwind dependencies).
- **Backend**: Node.js, Express.js.
- **Database**: Microsoft SQL Server 2025 / 2022 / 2019 via `mssql` and native `msnodesqlv8` driver.
- **Security & Authentication**: JSON Web Tokens (`jsonwebtoken`), password hashing via `bcryptjs`.

---

## User Roles & Key Features

### 1. Client Role
- Post detailed project requirements with title, category, budget, deadline, and skills.
- Manage posted projects (view, edit, delete).
- Review incoming proposals submitted by freelancers.
- Accept or reject proposals. Accepting a proposal automatically updates the project to `In Progress` and creates a formal assignment.

### 2. Freelancer Role
- Browse and filter open projects by keyword, category, budget, and deadline.
- Submit customized proposals with bid amount and pitch.
- Track status of submitted applications (Pending, Accepted, Rejected) on the dashboard.

### 3. Admin Role
- Platform analytics dashboard (total users, active clients/freelancers, project volume, application ratios).
- User management: search users, toggle active/inactive account status, or remove accounts.
- Project moderation: view all platform projects and remove inappropriate content.
- Application moderation: inspect all proposals across all projects.

---

## Seed Test Accounts

The database includes ready-to-test accounts with pre-seeded projects and applications:

| Role | Email | Password | Pre-loaded Data |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@marketplace.com` | `Admin@123` | Full administrative access |
| **Client** | `client@marketplace.com` | `Client@123` | Posted projects & pending proposals |
| **Client** | `sarah.client@company.com` | `Client@123` | Database tuning project |
| **Freelancer** | `freelancer@marketplace.com` | `Freelancer@123` | Active applications |
| **Freelancer** | `emily.freelancer@design.com` | `Freelancer@123` | Accepted project assignment |
| **Freelancer** | `david.code@dev.io` | `Freelancer@123` | Submitted bids |

> **Tip**: The login page (`/login.html`) has 1-click test buttons that autofill credentials and sign in immediately!

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- Microsoft SQL Server (2016 or higher, Developer / Express / Standard edition)
- SQL Server Command Line Utility (`sqlcmd`) or SQL Server Management Studio (SSMS)

### 1. Database Setup
Run the SQL script using `sqlcmd` with Windows Authentication:
```powershell
sqlcmd -S localhost -E -i "database\FreelanceMarketplaceDB.sql"
```
*Alternatively, open `database/FreelanceMarketplaceDB.sql` in SQL Server Management Studio (SSMS) and click **Execute**.*

### 2. Configure Backend Environment
Navigate to the `backend` directory and verify or customize `.env`:
```powershell
cd backend
```
In `backend/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=freelance_marketplace_super_secret_jwt_token_key_2026!
JWT_EXPIRES_IN=7d

# Windows Integrated Authentication (Default on Windows local instances)
DB_AUTH_TYPE=windows
DB_SERVER=localhost
DB_NAME=FreelanceMarketplaceDB

# If using SQL Server Authentication instead:
# DB_AUTH_TYPE=sql
# DB_USER=sa
# DB_PASSWORD=YourPassword
# DB_PORT=1433
```

### 3. Install Dependencies & Start Server
```powershell
npm install
npm start
```

Once started, open your browser at:
- **Web Application**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create Client or Freelancer account.
- `POST /api/auth/login` - Authenticate user and receive JWT.
- `GET /api/auth/me` - Get profile of authenticated user (`Bearer <token>`).
- `POST /api/auth/logout` - Invalidate local session.

### Projects (`/api/projects`)
- `GET /api/projects` - Browse open projects with query parameters: `search`, `category`, `minBudget`, `maxBudget`, `sortBy`, `status`.
- `GET /api/projects/:id` - Get details of a single project.
- `GET /api/projects/client/my` - Get all projects posted by authenticated Client.
- `POST /api/projects` - Client posts a new project.
- `PUT /api/projects/:id` - Update project details (Client owner or Admin).
- `DELETE /api/projects/:id` - Delete project (Client owner or Admin).

### Applications & Bids (`/api/applications`)
- `POST /api/applications` - Freelancer submits a proposal.
- `GET /api/applications/my` - Freelancer views all submitted applications.
- `GET /api/applications/client` - Client views applications for their projects.
- `PUT /api/applications/:id/status` - Client accepts or rejects proposal (`{ "status": "Accepted" | "Rejected" }`).

### Admin (`/api/admin`)
- `GET /api/admin/dashboard` - Platform statistics (users, projects, applications, volume).
- `GET /api/admin/users` - List all users with search, role, and active status filters.
- `PUT /api/admin/users/:id/toggle-status` - Activate or deactivate user account.
- `DELETE /api/admin/users/:id` - Delete user account and associated records.
- `GET /api/admin/projects` - List all projects across the platform.
- `DELETE /api/admin/projects/:id` - Remove project.
- `GET /api/admin/applications` - List all applications across the platform.
- `DELETE /api/admin/applications/:id` - Remove application record.

---

## License
MIT License.

