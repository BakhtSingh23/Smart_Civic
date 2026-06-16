# Smart Civic Issue Resolution

A full-stack civic complaint management system with citizen, admin, officer, and worker roles.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/BakhtSingh23/Smart_Civic_Issue_Resolution.git
cd Smart_Civic_Issue_Resolution
```

### 2. Set up environment variables

The server requires a `.env` file. Copy the example and fill in your values:

```bash
cp server/.env.example server/.env
```

Open `server/.env` and configure at minimum:
- `MONGO_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — any long random secret string
- `ADMIN_EMAIL` — the email for the default admin account
- `ADMIN_PASSWORD` — the password for the default admin account

> **Warning:** The default credentials in `.env.example` are for local development only. Change `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `JWT_SECRET` before deploying to production.

### 3. Install dependencies

```bash
npm run install:all
```

### 4. Run in development mode

```bash
npm run dev
```

This starts both the backend (port 5000) and frontend (port 5173).

### 5. Admin login

Navigate to `http://localhost:5173/login` and use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values from your `.env` file. The admin account is auto-created on first server startup.