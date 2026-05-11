# Civil Case Management Platform — Cursor Project Specification

> **For Cursor AI:** Read this entire document before generating any code. Follow every instruction precisely. Do not deviate from the defined stack, schema, or business rules.

---

## 1. Project Overview

Build a **web-based Civil Case Management Platform** for breach-of-contract lawsuits. The system connects three roles — Judge, Plaintiff Lawyer, and Defense Lawyer — in a structured digital environment for managing legal case files.

---

## 2. Tech Stack (Non-Negotiable)

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL via Supabase |
| Authentication | Supabase Auth |

**Do not** suggest or use any alternative technologies. Do not add unnecessary dependencies.

---

## 3. Database Schema

Create all tables in Supabase. Use UUIDs for all primary keys. Enable Row Level Security (RLS) on all tables.

### 3.1 `users`
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('JUDGE', 'PLAINTIFF_LAWYER', 'DEFENSE_LAWYER')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.2 `cases`
```sql
CREATE TABLE cases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')),
  judge_id    UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.3 `case_participants`
```sql
CREATE TABLE case_participants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id    UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id),
  side       TEXT NOT NULL CHECK (side IN ('PLAINTIFF', 'DEFENSE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(case_id, side)  -- enforces one lawyer per side per case
);
```

### 3.4 `documents`
```sql
CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('DEMAND', 'RESPONSE', 'MOTION', 'EVIDENCE', 'ORDER', 'SENTENCE')),
  file_url    TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.5 `case_events`
```sql
CREATE TABLE case_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id),
  event_type  TEXT NOT NULL,
  description TEXT,
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.6 `notifications`
```sql
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id),
  case_id    UUID REFERENCES cases(id),
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. Project Structure

```
/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/                # Axios/fetch wrappers for each resource
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # One file per route
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CaseDetail.jsx
│   │   │   ├── NewCase.jsx
│   │   │   └── Profile.jsx
│   │   ├── context/            # AuthContext, NotificationContext
│   │   ├── hooks/              # useAuth, useCases, useNotifications
│   │   └── App.jsx             # Router setup
│   └── vite.config.js
│
└── server/                     # Node.js + Express backend
    ├── routes/
    │   ├── cases.js
    │   ├── participants.js
    │   ├── documents.js
    │   ├── events.js
    │   └── notifications.js
    ├── middleware/
    │   ├── auth.js             # Validates Supabase JWT
    │   └── roleGuard.js        # Role-based access control
    ├── services/
    │   └── supabase.js         # Supabase admin client
    └── index.js
```

---

## 5. Authentication Flow

1. User registers via `/register` → Supabase Auth creates the auth user.
2. After email confirmation (or immediately if disabled), insert a row into the `users` table with the selected role.
3. On login, Supabase Auth issues a JWT.
4. The frontend sends the JWT as `Authorization: Bearer <token>` on all API requests.
5. The Express `auth.js` middleware verifies the JWT using Supabase's public keys and attaches the user to `req.user`.

> **Cursor:** Implement the `auth` middleware using `@supabase/supabase-js` `createClient` with the service role key on the server side.

---

## 6. API Endpoints

All routes are prefixed with `/api`. All routes except auth are protected by the `auth` middleware.

### Cases
| Method | Path | Role Restriction | Description |
|---|---|---|---|
| GET | `/api/cases` | All | List cases where user is judge or participant |
| GET | `/api/cases/:id` | All | Get case detail (must be a participant or judge) |
| POST | `/api/cases` | JUDGE only | Create a new case |
| PATCH | `/api/cases/:id/status` | JUDGE only | Change case status |

### Participants
| Method | Path | Role Restriction | Description |
|---|---|---|---|
| POST | `/api/cases/:id/participants` | JUDGE only | Assign a lawyer to a case (specify `user_id` and `side`) |

### Documents
| Method | Path | Role Restriction | Description |
|---|---|---|---|
| GET | `/api/cases/:id/documents` | Case participants | List all documents for a case |
| POST | `/api/cases/:id/documents` | Assigned lawyers only | Upload a document (file upload via multipart/form-data) |
| GET | `/api/documents/:id` | Case participants | Get document metadata |

### Events
| Method | Path | Role Restriction | Description |
|---|---|---|---|
| GET | `/api/cases/:id/events` | Case participants | Get chronological event log for a case |

### Notifications
| Method | Path | Role Restriction | Description |
|---|---|---|---|
| GET | `/api/notifications` | All | Get all notifications for the logged-in user |
| PATCH | `/api/notifications/:id/read` | Owner only | Mark a notification as read |

---

## 7. Business Rules

Enforce these rules in the backend. Never rely solely on frontend validation.

1. **Only a JUDGE can create a case.**
2. **Only a JUDGE can change case status** (OPEN → IN_PROGRESS → CLOSED).
3. **Only assigned lawyers can upload documents** to a case. Verify by checking `case_participants`.
4. **Documents cannot be uploaded to a CLOSED case.** Return HTTP 403 if attempted.
5. **Documents are immutable.** No PUT or DELETE endpoints for documents. Only POST is allowed.
6. **A case must have exactly:** 1 judge (set at creation), 1 PLAINTIFF lawyer, and 1 DEFENSE lawyer.
7. **`UNIQUE(case_id, side)`** constraint in `case_participants` enforces one lawyer per side.
8. **Users can only see cases they are part of** (as judge or participant). The `/api/cases` endpoint must filter accordingly.
9. **Every document upload must automatically trigger:**
   - Creation of a `case_events` row with `event_type = 'DOCUMENT_UPLOADED'`.
   - Creation of `notifications` rows for all other parties on the case (judge + both lawyers, excluding uploader).

---

## 8. Frontend Routes & Pages

### Public Routes
- `/login` — Login form using Supabase Auth.
- `/register` — Registration form. Includes a role selector (JUDGE, PLAINTIFF_LAWYER, DEFENSE_LAWYER).

### Private Routes (redirect to `/login` if unauthenticated)

| Path | Component | Access |
|---|---|---|
| `/dashboard` | Dashboard | All roles |
| `/cases/:id` | CaseDetail | Case participants |
| `/cases/new` | NewCase | JUDGE only |
| `/profile` | Profile | All roles |

### Page Requirements

**Dashboard (`/dashboard`)**
- Lists all cases the user is associated with.
- Show case title, status badge, and date.
- Link to `/cases/:id` for each row.

**Case Detail (`/cases/:id`)**
- Display case title, status, description, and assigned parties.
- Chronological timeline of `case_events`.
- List of uploaded documents with title, type, uploader, and download link.
- Document upload form (visible only to assigned lawyers on non-CLOSED cases).
- Status change button (visible only to judge).

**New Case (`/cases/new`)**
- Form with fields: title, description.
- Lawyer assignment section: search/select PLAINTIFF lawyer and DEFENSE lawyer by email or name.
- On submit: POST `/api/cases`, then POST `/api/cases/:id/participants` for each lawyer.

**Profile (`/profile`)**
- Display user's name, email, and role (read-only).

---

## 9. Environment Variables

### Client (`client/.env`)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3001
```

### Server (`server/.env`)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
```

---

## 10. Key Implementation Notes for Cursor

- **File uploads:** Use `multer` on the server to handle multipart/form-data. Upload to Supabase Storage and store the returned public URL in `documents.file_url`.
- **Auth middleware:** Use `supabase.auth.getUser(token)` to validate the Bearer token. Attach the user's DB record to `req.user`.
- **Role guard middleware:** Create a `requireRole(...roles)` factory function that returns 403 if `req.user.role` is not in the allowed list.
- **Atomic document upload:** Wrap document insert + event insert + notification inserts in a single Supabase transaction or sequential awaits with error rollback.
- **React Router v6:** Use `<Navigate>` for redirects. Protect private routes with a `<PrivateRoute>` wrapper component that checks auth context.
- **No CSS frameworks are mandated**, but keep UI clean and functional. Tailwind CSS is acceptable if preferred.
- **Run both client and server concurrently** in development using `concurrently` or separate terminal sessions.

---

## 11. Starter Commands

```bash
# Backend
cd server
npm init -y
npm install express @supabase/supabase-js multer dotenv cors

# Frontend
cd client
npm create vite@latest . -- --template react
npm install @supabase/supabase-js react-router-dom axios
```

---

*End of specification. Begin implementation by scaffolding the project structure, then implement auth, then cases, then documents.*
