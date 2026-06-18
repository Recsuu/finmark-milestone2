# FinMark – Milestone 2
## MO-IT151 | Group 14 | H3101

---

## What We Set Up

The core **Authentication Module** of the FinMark platform — user registration, login, JWT-based session management, and a protected dashboard — directly implementing the Authentication Service defined in the Milestone 1 architecture.

### Project Structure

```
finmark/
├── backend/
│   ├── config/
│   │   ├── db.js              # MSSQL connection pool
│   │   └── setup.sql          # Creates FinMarkDB and Users table
│   ├── controllers/
│   │   └── authController.js  # register() and login() handlers
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT Bearer token verification
│   ├── routes/
│   │   └── authRoutes.js      # Route definitions
│   ├── .env                   # DB credentials and JWT config (not committed)
│   ├── package.json
│   └── server.js              # Express entry point, port 5000
│
└── frontend/
    ├── public/index.html
    ├── .env                   # HOST, PORT, DANGEROUSLY_DISABLE_HOST_CHECK
    └── src/
        ├── components/Auth.module.css
        ├── pages/
        │   ├── LoginPage.js       # Login form → POST /api/auth/login
        │   ├── RegisterPage.js    # Register form → POST /api/auth/register
        │   └── DashboardPage.js   # Protected, token-gated view
        ├── App.js                 # React Router v6 routes
        └── index.js
```

### Tech Stack

| Layer    | Technology          | Reason                                              |
|----------|---------------------|-----------------------------------------------------|
| Frontend | React 18 + Router v6 | Component-based UI, declarative routing            |
| Backend  | Node.js + Express   | Lightweight REST API                                |
| Database | MSSQL (mssql v11)   | Consistent with Milestone 1 architecture           |
| Auth     | jsonwebtoken        | Stateless JWT, specified in Milestone 1            |
| Security | bcryptjs            | Password hashing (salt rounds: 10)                 |

### API Endpoints

| Method | Endpoint           | Description                    | Auth Required |
|--------|--------------------|--------------------------------|---------------|
| POST   | /api/auth/register | Register new user              | No            |
| POST   | /api/auth/login    | Login, returns signed JWT      | No            |
| GET    | /api/auth/me       | Return current user from token | Yes (Bearer)  |

---

## How to Run

### Prerequisites
- Node.js v18+ (tested on v24.15.0)
- Docker Desktop (for the database — no local SQL Server / SSMS install needed)
- npm

### 1 — Database setup (Docker)
Every teammate runs the exact same DB this way — no manual SSMS, no enabling TCP/IP or SQL Authentication by hand.

```bash
docker compose up -d
```

This starts a SQL Server container on `localhost:1433` and a one-shot init container that automatically applies `backend/config/setup.sql`:
- Creates `FinMarkDB` and the `Users` table
- Seeds one test admin account (`admin@finmark.com` / `Admin@1234`)

Data persists in a Docker volume, so it survives container restarts. Check it came up clean with `docker compose logs db-init` (should end with `FinMarkDB setup complete!`).

To reset the database from scratch: `docker compose down -v && docker compose up -d`.

<details>
<summary>Alternative: local SQL Server Express + SSMS (no Docker)</summary>

1. Open SSMS and connect to your local SQL Server instance
2. Open and run `backend/config/setup.sql`
3. Update `backend/.env` to match your local instance's credentials/port

</details>

### 2 — Backend environment variables
Copy `backend/.env.example` to `backend/.env` (defaults already match the Docker setup above):
```
DB_USER=sa
DB_PASSWORD=FinMark@1234
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=FinMarkDB
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1h
PORT=5000
```

### 3 — Run the backend
```bash
cd backend
npm install
npm run dev       # nodemon, auto-restarts on changes
```
Runs on `http://localhost:5000`

Troubleshooting Steps:
    If it's showing an error regarding missing "config.server" property
    1. run: copy .env.example .env 
    2. copy .env.example .env 
    3. then run: npm run dev

### 4 — Run the frontend
```bash
cd frontend
npm install
npm start
```
Runs on `http://localhost:3000`

The frontend `.env` (already committed) contains the three flags required to run on Node.js v24:
```
HOST=localhost
PORT=3000
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

---

## Challenges Encountered

**1. Dev server failure on Node.js v24**
The biggest setup issue. `react-scripts 4.0.3` was in `package.json` with the start script `react-scripts --openssl-legacy-provider start`. On Node.js v24, webpack-dev-server v4 rejected the dev server options with:
```
options.allowedHosts[0] should be a non-empty string
```
Root cause: when `proxy` is set in `package.json`, react-scripts 5 builds `allowedHosts: [lanUrlForConfig]`. On this machine `lanUrlForConfig` resolved to `undefined`, failing WDS schema validation.

**Fix applied:**
- Upgraded `react-scripts` to `5.0.1` (webpack 5, no OpenSSL legacy provider needed)
- Removed `--openssl-legacy-provider` from the start script
- Added `DANGEROUSLY_DISABLE_HOST_CHECK=true` to `frontend/.env` — forces `allowedHosts: 'all'` instead of the broken dynamic array

**2. MSSQL local setup**
SQL Server requires TCP/IP to be explicitly enabled in SQL Server Configuration Manager, and SQL Authentication must be turned on separately from Windows Authentication. Neither is on by default.

**3. CORS between ports 3000 and 5000**
Initial requests from the frontend were blocked. Resolved by adding the `cors` package to Express and setting `proxy: "http://localhost:5000"` in the frontend `package.json` so dev API calls are automatically proxied.

**4. JWT token flow across components**
Token had to be stored in `localStorage` on login, attached as a `Bearer` header on protected requests, and cleared on logout — each step had to be wired up manually without a state management library.

---

## What Worked

- Registration hashes passwords with bcrypt and stores them safely in MSSQL
- Login validates credentials and returns a signed JWT with `id`, `email`, and `role` claims
- `authMiddleware.js` correctly gates protected routes and rejects expired or malformed tokens
- React Router redirects unauthenticated users to `/login` and sends authenticated users to `/dashboard`
- Logout clears `localStorage` and redirects back to login without a page reload

---

## What Needs Refinement

- **Frontend input validation** — password strength rules and email format checks before the request is sent
- **Refresh tokens** — current JWTs expire and force re-login; a refresh token flow would improve UX
- **Role-based views** — `role` is stored and included in the JWT but not yet used to differentiate UI for admin vs. regular users
- **Rate limiting** — the `/api/auth/login` endpoint has no brute-force protection; `express-rate-limit` should be added
- **HTTPS in development** — the current setup uses plain HTTP; setting `HTTPS=true` in the frontend `.env` and adding a cert to Express would align with production expectations
- **Future milestones** — connect to the Transaction and Reporting services defined in the Milestone 1 architecture

---

*Authentication Service foundation as specified in the FinMark Milestone 1 architecture.*
