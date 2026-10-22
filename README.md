# Freelance Marketplace Platform (Spring Boot + MySQL + React.js)

A complete, production-ready, full-stack **Freelance Marketplace Platform** featuring a **React.js Single Page Application (SPA)**, a **Java 17 & Spring Boot 3.3.x REST API backend**, and a **MySQL 8.0 database**.

> [!IMPORTANT]
> **Preserved UI Design**: The frontend has been faithfully converted from the original static pages to React components while preserving 100% of the original CSS design, color palette, fonts, spacing, layout, card structure, and badges. All existing portfolio screenshots remain completely valid and consistent.

---

## 1. Technology Stack

- **Frontend**:
  - React.js (v18)
  - React Router DOM (v6) for client-side routing
  - Axios for API communication with JWT interceptors
  - Pure CSS3 design system (preserved from original `style.css`)
  - Vite for high-speed local development and production bundling
- **Backend**:
  - Java 17 LTS
  - Spring Boot 3.3.4
  - Spring Web (RESTful APIs)
  - Spring Data JPA (Hibernate ORM)
  - Spring Security with Stateless JWT Filter
  - JJWT (JSON Web Token) for authentication
  - BCrypt password hashing
  - Apache Maven (with included `mvnw` Maven Wrapper)
- **Database**:
  - MySQL 8.0
  - Connector: `mysql-connector-j`

---

## 2. Project Architecture & Folder Structure

```text
FreelanceMarketplace/
├── backend/                               # Java 17 & Spring Boot Backend
│   ├── mvnw & mvnw.cmd                    # Maven Wrapper scripts (cross-platform)
│   ├── pom.xml                            # Maven dependencies & build configuration
│   └── src/
│       ├── main/
│       │   ├── java/com/marketplace/
│       │   │   ├── FreelanceMarketplaceApplication.java # Spring Boot entrypoint
│       │   │   ├── config/                # SecurityConfig, CorsConfig
│       │   │   ├── controller/            # AuthController, ProjectController, ApplicationController, AdminController, HealthController
│       │   │   ├── dto/                   # Request & Response Data Transfer Objects
│       │   │   ├── entity/                # JPA Entities: User, Project, Application, ProjectAssignment, Enums
│       │   │   ├── exception/             # GlobalExceptionHandler & custom exceptions
│       │   │   ├── repository/            # Spring Data JPA Repositories
│       │   │   ├── security/              # JwtTokenProvider, JwtAuthenticationFilter, UserPrincipal
│       │   │   └── service/               # Business logic services
│       │   └── resources/
│       │       ├── application.properties # Active MySQL & JWT configuration
│       │       └── application.properties.example # Sample configuration template
│
├── frontend/                              # React.js Single Page Application
│   ├── index.html                         # SPA root HTML template
│   ├── package.json                       # React, React Router, Axios dependencies
│   ├── vite.config.js                     # Vite build & API proxy configuration
│   ├── css/style.css                      # Preserved CSS design system
│   └── src/
│       ├── main.jsx                       # React DOM entrypoint
│       ├── App.jsx                        # React Router routing & layout
│       ├── index.css                      # Complete stylesheet
│       ├── components/                    # Navbar, Footer, ProtectedRoute
│       ├── context/                       # AuthContext (JWT & user state)
│       ├── pages/                         # All 15 converted pages
│       └── services/                      # Axios API client, toast notifications, formatters
│
├── database/                              # Database SQL Scripts
│   ├── FreelanceMarketplaceDB_mysql.sql   # Complete MySQL schema & realistic seed data
│   └── FreelanceMarketplaceDB.sql         # Original SQL Server script (preserved)
│
├── _backup_original/                      # Complete backup of original project
│   ├── backend/                           # Original Node.js / Express backend
│   └── frontend/                          # Original static HTML / JS pages
│
├── .env.example                           # Sample environment variable template
├── .gitignore                             # Git ignore rules
└── README.md                              # Project documentation
```

---

## 3. User Roles & Capabilities

| Role | Access Level & Permissions |
| :--- | :--- |
| **CLIENT** | Register, Login, Post projects, Edit/delete own projects, View incoming proposals, Accept or reject freelancer proposals, Track active assignments. |
| **FREELANCER** | Register, Login, Search & filter projects by category/budget, View project details, Submit proposals with custom bid amounts, Track proposal statuses (Pending, Accepted, Rejected). |
| **ADMIN** | Login, View system-wide analytics, Search & moderate users (Activate / Deactivate / Delete), Review and delete inappropriate projects, Supervise all applications. |

---

## 4. Prerequisites

Ensure the following tools are installed on your computer:
1. **Java JDK 17** (or newer): Run `java -version` to verify.
2. **Node.js 18+ & npm**: Run `node -v` and `npm -v` to verify.
3. **MySQL Server 8.0**: Installed and running on `localhost:3306`.
4. **VS Code**: Recommended editor for local development.

---

## 5. Step-by-Step Setup Guide

### Step 1: Initialize the MySQL Database

1. Open your terminal, PowerShell, or MySQL Workbench.
2. Connect to MySQL and run the initialization script located at `database/FreelanceMarketplaceDB_mysql.sql`:
   ```powershell
   mysql -u root -p < database/FreelanceMarketplaceDB_mysql.sql
   ```
   *Or open MySQL Workbench, open `database/FreelanceMarketplaceDB_mysql.sql`, and execute the script.*
3. This creates `FreelanceMarketplaceDB` with all tables, constraints, foreign keys, indexes, and realistic seed data.

### Step 2: Configure Database Password (if needed)

The backend reads database credentials from environment variables with sensible defaults in `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:mysql://localhost:3306/FreelanceMarketplaceDB?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME:root}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:}
```
You can pass your local MySQL password when running the backend:
```powershell
$env:SPRING_DATASOURCE_PASSWORD="your_mysql_password"
```
Or define it in `application.properties` directly on your local machine (without committing passwords to Git).

### Step 3: Run the Spring Boot Backend

Open a terminal and execute:
```powershell
cd backend
$env:MAVEN_OPTS="-Xms128m -Xmx256m -XX:+UseSerialGC"
.\mvnw spring-boot:run
```
*(If Maven is installed globally on your machine, you can also run `mvn spring-boot:run`)*

The backend will start on **`http://localhost:8080`**.
You can verify the API is running by visiting: [http://localhost:8080/api/health](http://localhost:8080/api/health)

### Step 4: Run the React.js Frontend

Open a second terminal and execute:
```powershell
cd frontend
npm install
npm run dev
```

The React development server will start on **`http://localhost:5173`**.
Open your browser and navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 6. Pre-Configured Test Accounts & Authentication

* **🛡️ Development Admin**:
  - Email: `admin@marketplace.com`
  - Password: `Admin@123`
  - Role: `ADMIN`
  - A 1-click **Autofill Admin Credentials** button is provided at the bottom of the login page to fill these credentials. The user clicks **Sign In** to authenticate normally.
* **💼 Clients & 💻 Freelancers**:
  - Users can register directly via the **Sign Up** page choosing either the **Client** or **Freelancer** role.
  - Existing registered users log in with their own registered email and password.

---

## 7. REST API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create client or freelancer account.
- `POST /api/auth/login` - Authenticate credentials and receive JWT.
- `GET /api/auth/me` - Get profile of authenticated user.
- `POST /api/auth/logout` - Invalidate client session.

### Projects (`/api/projects`)
- `GET /api/projects` - Public project search and catalog (supports `search`, `category`, `minBudget`, `maxBudget`, `status`, `sortBy`).
- `GET /api/projects/{id}` - Single project details with client info.
- `GET /api/projects/client/my` - Client's own posted projects with proposal counts *(Role: CLIENT)*.
- `POST /api/projects` - Publish a new project *(Role: CLIENT)*.
- `PUT /api/projects/{id}` - Edit project specifications *(Role: CLIENT, ADMIN)*.
- `PATCH /api/projects/{id}/status` - Update project status *(Role: CLIENT, ADMIN)*.
- `DELETE /api/projects/{id}` - Remove project *(Role: CLIENT, ADMIN)*.

### Applications & Proposals (`/api/applications`)
- `POST /api/applications` - Submit proposal & bid amount *(Role: FREELANCER)*.
- `GET /api/applications/my` - View all submitted applications *(Role: FREELANCER)*.
- `GET /api/applications/client` - View received proposals for client's projects *(Role: CLIENT)*.
- `PUT /api/applications/{id}/status` - Accept or reject proposal *(Role: CLIENT, ADMIN)*.

### Platform Administration (`/api/admin`)
- `GET /api/admin/dashboard` - Global platform analytics & stats *(Role: ADMIN)*.
- `GET /api/admin/users` - Search and filter all registered users *(Role: ADMIN)*.
- `PUT /api/admin/users/{id}/toggle-status` - Activate or deactivate user *(Role: ADMIN)*.
- `DELETE /api/admin/users/{id}` - Delete user account *(Role: ADMIN)*.
- `GET /api/admin/projects` - Inspect all projects across the platform *(Role: ADMIN)*.
- `DELETE /api/admin/projects/{id}` - Remove project *(Role: ADMIN)*.
- `GET /api/admin/applications` - Review all proposals across all projects *(Role: ADMIN)*.
- `DELETE /api/admin/applications/{id}` - Remove proposal *(Role: ADMIN)*.

---

## 8. Verification & Test Confirmation

- **Backend Build & Tests**: Verified with Maven 3.9.15 and Java 17 LTS (All 14 unit and integration tests passed).
- **Frontend Build**: Verified with Vite 5.4 (`npm run build` completed cleanly with 0 errors).
- **Database Schema**: MySQL 8.0 schema validated with foreign keys, unique constraints, and seed data.
- **Visual Parity**: Converted React pages match the exact CSS classNames, layout structure, color tokens, and responsive cards of the original design.

---

## 9. Cloud Deployment Guide

### Option A: Frontend Deployment (Vercel / Netlify)
1. Push this repository to GitHub.
2. Link the repository to **Vercel** or **Netlify**.
3. Set **Root Directory** to `frontend`.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Set Environment Variable: `VITE_API_URL=https://your-backend-domain.com/api` (if pointing to a remote backend).

### Option B: Backend Deployment (Render / Railway / AWS)
1. Deploy from the `backend` folder on **Render** (as a Web Service) or **Railway**.
2. Build command: `./mvnw clean package -DskipTests`
3. Start command: `java -jar target/freelance-marketplace-backend-1.0.0.jar`
4. Set Environment Variables:
   - `SPRING_DATASOURCE_URL`: `jdbc:mysql://<host>:<port>/<dbname>?useSSL=true`
   - `SPRING_DATASOURCE_USERNAME`: `<db_user>`
   - `SPRING_DATASOURCE_PASSWORD`: `<db_password>`
   - `JWT_SECRET`: `<secure_random_32_char_string>`

### Option C: Cloud MySQL Database (Aiven / PlanetScale / Railway)
1. Create a MySQL 8.0 instance on **Aiven** or **Railway**.
2. Run `database/FreelanceMarketplaceDB_mysql.sql` on the cloud MySQL database.
3. Copy the host, port, username, and password into your backend environment variables.
