# DevPulse — Issue Tracker API

A RESTful API built with **Node.js**, **Express.js**, **TypeScript**, and **PostgreSQL** for managing bug reports and feature requests with role-based access control.

---

## Live URL

```
https://expressjs-topaz-ten.vercel.app
```

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js (LTS) | Runtime environment |
| TypeScript | Type-safe development |
| Express.js | Web framework with modular router architecture |
| PostgreSQL | Relational database |
| Raw SQL (pg) | Direct pool.query() calls — no ORM or query builder |
| bcrypt | Password hashing (salt rounds: 10) |
| jsonwebtoken | JWT generation and verification |

---

## Getting Started — Local Setup

### Step 1 — Clone the repository

```bash
git clone https://github.com/Samirsrz/Assignment_2-Level_2
cd Assignment_2-Level_2
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Create `.env` file

Create a `.env` file in the root directory and add:

```env
PORT=3000
DATABASE_URL=your_neon_postgresql_connection_string
JWT_ACCESS=your_jwt_secret_key
```

### Step 4 — Run in development

```bash
npm run dev
```

### Step 5 — Build for production

```bash
npm run build
npm start
```

---

## Database Schema

### Table: `users`

| Column | Type | Description |
|---|---|---|
| id | SERIAL PRIMARY KEY | Auto-incrementing unique identifier |
| name | VARCHAR(255) NOT NULL | Full display name |
| email | VARCHAR(255) NOT NULL UNIQUE | Login email address |
| password | VARCHAR(255) NOT NULL | Bcrypt hashed password, never returned in responses |
| role | VARCHAR(20) DEFAULT 'contributor' | Access level — contributor or maintainer |
| created_at | TIMESTAMP DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP DEFAULT NOW() | Last update timestamp |

### Table: `issues`

| Column | Type | Description |
|---|---|---|
| id | SERIAL PRIMARY KEY | Auto-incrementing unique identifier |
| title | VARCHAR(150) NOT NULL | Short descriptive headline |
| description | TEXT NOT NULL | Detailed explanation (min 20 characters) |
| type | VARCHAR(20) NOT NULL | bug or feature_request |
| status | VARCHAR(20) DEFAULT 'open' | open, in_progress, or resolved |
| reporter_id | INTEGER NOT NULL | References the user who submitted the issue |
| created_at | TIMESTAMP DEFAULT NOW() | Issue creation timestamp |
| updated_at | TIMESTAMP DEFAULT NOW() | Last update timestamp |

---

## User Roles & Permissions

| Role | Permissions |
|---|---|
| contributor | Register, login, create issues, view all issues, update own open issues |
| maintainer | All contributor permissions + update any issue + delete any issue |

---

## API Endpoints

### Authentication

#### Register a new user
```
POST /api/auth/signup
```
Request body:
```json
{
  "name": "John Doe",
  "email": "john.doe@devpulse.com",
  "password": "securePassword123",
  "role": "contributor"
}
```
Success response `201`:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@devpulse.com",
    "role": "contributor",
    "created_at": "2026-01-20T09:00:00Z",
    "updated_at": "2026-01-20T09:00:00Z"
  }
}
```

#### Login
```
POST /api/auth/login
```
Request body:
```json
{
  "email": "john.doe@devpulse.com",
  "password": "securePassword123"
}
```
Success response `200`:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@devpulse.com",
      "role": "contributor"
    }
  }
}
```

---

### Issues

#### Create an issue
```
POST /api/issues
Authorization: <JWT_TOKEN>
```
Request body:
```json
{
  "title": "Database connection timeout under load",
  "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
  "type": "bug"
}
```
Success response `201`:
```json
{
  "success": true,
  "message": "Issue created successfully",
  "data": {
    "id": 45,
    "title": "Database connection timeout under load",
    "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
    "type": "bug",
    "status": "open",
    "reporter_id": 1,
    "created_at": "2026-01-20T10:30:00Z",
    "updated_at": "2026-01-20T10:30:00Z"
  }
}
```

#### Get all issues
```
GET /api/issues
GET /api/issues?sort=oldest
GET /api/issues?type=bug
GET /api/issues?status=open
GET /api/issues?type=bug&status=open
```

Query parameters:

| Param | Values | Default |
|---|---|---|
| sort | newest, oldest | newest |
| type | bug, feature_request | none |
| status | open, in_progress, resolved | none |

#### Get single issue
```
GET /api/issues/:id
```

#### Update issue
```
PATCH /api/issues/:id
Authorization: <JWT_TOKEN>
```
Access rules:
- Maintainer — can update any issue
- Contributor — can only update their own issue if status is `open`

Request body:
```json
{
  "title": "Updated title",
  "description": "Updated description with reproduction steps...",
  "type": "bug"
}
```

#### Delete issue
```
DELETE /api/issues/:id
Authorization: <JWT_TOKEN>
```
Access: Maintainer only

---

## Authentication Flow

```
1. POST /api/auth/signup  →  create account
2. POST /api/auth/login   →  receive JWT token
3. Copy the token from the response
4. Add to protected requests: Authorization: <token>
```

---

## Error Response Format

```json
{
  "success": false,
  "message": "Error description"
}
```

## HTTP Status Codes

| Code | Usage |
|---|---|
| 200 | Successful GET, PATCH, DELETE |
| 201 | Successful POST (resource created) |
| 401 | Missing or invalid JWT token |
| 403 | Valid token but insufficient permissions |
| 404 | Resource not found |
| 409 | Business logic conflict (editing non-open issue) |
| 500 | Internal server error |
