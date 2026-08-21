# ThreatLens AI - Setup Guide

This guide describes the local setup for the current ThreatLens AI repository. It assumes a macOS or Linux-style shell and a PostgreSQL-compatible relational database. The repository does not currently provide a working Docker Compose environment or an `.env.example` file, so database and secret configuration must be supplied locally.

## 1. Prerequisites

Install or obtain the following before starting:

- macOS, Linux, or another Unix-like development environment. The project is currently developed on macOS; no Windows-specific setup is documented in the repository.
- Python 3.10 or newer. No Python version is pinned in the repository, but the backend uses modern type syntax such as `str | None`, which requires Python 3.10 or newer.
- Node.js compatible with Next.js 16. The repository does not declare an `engines` range; use a current Node.js LTS release supported by Next.js 16.
- `pip` and Python's built-in `venv` module for the backend.
- `npm` for the frontend. `frontend/package-lock.json` is committed, so use `npm install` or `npm ci`.
- A PostgreSQL-compatible database reachable through the SQLAlchemy URL in `DATABASE_URL`. The backend dependencies include `psycopg` and `psycopg-binary`.
- Git.
- AbuseIPDB and VirusTotal API keys if you want threat-feed lookup or correlation to succeed.

Docker is not currently required or usable as a supported setup path: the root `docker-compose.yml` exists but is empty. No database container, application image, or supporting service is defined there.

## 2. Clone the Repository

Clone the repository using its current GitHub owner and repository name:

```bash
git clone https://github.com/Aryan457-dev/ThreatLens-AI.git
cd ThreatLens-AI
```

The repository has two independently installed applications:

- Backend: `backend/`
- Frontend: `frontend/`

Run backend commands from `backend/` unless stated otherwise. This matters because the backend configuration uses `env_file=".env"`, and Alembic imports the application using the current Python path.

## 3. Backend Setup

### Create and activate a virtual environment

From the repository root:

```bash
cd backend
python3 --version
python3 -m venv .venv
source .venv/bin/activate
```

On a shell where `python3` is not the desired interpreter, use the path to the Python 3.10+ executable instead. Confirm the active interpreter with:

```bash
python --version
which python
```

The existing `.venv/` directory is ignored by Git. Recreate it locally when setting up a fresh clone rather than relying on a copied environment.

### Install backend dependencies

With the virtual environment active and the working directory still `backend/`:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

The requirements include FastAPI, Uvicorn, SQLAlchemy, Alembic, Psycopg, HTTPX, Pydantic settings, JWT support, and bcrypt password hashing.

### Create backend configuration

There is no committed `backend/.env.example`. Create `backend/.env` locally and provide all settings required by `backend/app/core/config.py`:

```dotenv
APP_NAME=ThreatLens AI
APP_VERSION=0.1.0
APP_DESCRIPTION=Local ThreatLens AI backend
DEBUG=false
API_PREFIX=/api/v1
DATABASE_URL=postgresql+psycopg://<database_user>:<database_password>@<database_host>:5432/<database_name>
ABUSEIPDB_API_KEY=<your_abuseipdb_key>
VIRUSTOTAL_API_KEY=<your_virustotal_key>
JWT_SECRET_KEY=<long_random_local_secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Use real local values in the file, but never commit it or place real credentials in documentation. `backend/.gitignore` ignores `.env` and `.env.*`.

All of the following settings are required by the Pydantic settings class, even when a particular request does not use them directly:

- `APP_NAME`, `APP_VERSION`, `APP_DESCRIPTION`
- `API_PREFIX`
- `DATABASE_URL`
- `ABUSEIPDB_API_KEY`
- `VIRUSTOTAL_API_KEY`
- `JWT_SECRET_KEY`

`DEBUG` defaults to `false`. `JWT_ALGORITHM` defaults to `HS256`, and `ACCESS_TOKEN_EXPIRE_MINUTES` defaults to `60`, but setting them explicitly makes local behavior clear.

### Initialize the database schema

The project uses Alembic migrations. From `backend/`, with `.env` present and the database server reachable:

```bash
alembic upgrade head
```

The migration chain creates these tables:

1. `iocs`
2. `threat_analyses`
3. `users`

Alembic configuration is in `backend/alembic.ini`. `backend/alembic/env.py` overrides its blank `sqlalchemy.url` with `settings.DATABASE_URL`, so the URL must be available through `backend/.env` when the command runs.

### Start the backend

From `backend/` with the virtual environment active:

```bash
uvicorn app.main:app --reload
```

The backend listens on `http://127.0.0.1:8000` by default. Uvicorn's default host and port are used because the repository does not define a separate server script or launch configuration.

## 4. Frontend Setup

### Install dependencies

Open a second terminal from the repository root and run:

```bash
cd frontend
npm ci
```

`npm ci` uses the committed `frontend/package-lock.json`. Use `npm install` only when intentionally updating dependency metadata.

The frontend package declares Next.js `16.3.0`, React `19.2.8`, TypeScript, Tailwind CSS 4, `lucide-react`, and `recharts`. No Node.js version is declared in `package.json`, so the installed Node.js version must be compatible with Next.js 16.

### Configure the frontend API URL

The frontend does not require a committed environment file. Several pages use this optional variable:

```dotenv
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

Create `frontend/.env.local` if you need to override the default. `frontend/.gitignore` ignores `.env*` files.

The current code is not completely centralized around this setting: the IOC and Threat Feed pages contain a hard-coded `http://127.0.0.1:8000` base and append `/api/v1`, while the dashboard, auth guard, login, register, Threat Analysis, and Correlation code read `NEXT_PUBLIC_API_URL` or a related default. For the default local backend, no override is needed.

### Start the frontend

From `frontend/`:

```bash
npm run dev
```

Next.js serves the application at `http://localhost:3000` by default.

## 5. Environment Variables

The backend variables below come from `backend/app/core/config.py`. No `.env.example` file exists in the current repository. Examples are placeholders only and do not contain credentials.

| Variable | Purpose | Required/optional | Example format |
| --- | --- | --- | --- |
| `APP_NAME` | FastAPI application name and root response metadata. | Required | `ThreatLens AI` |
| `APP_VERSION` | Application version metadata. | Required | `0.1.0` |
| `APP_DESCRIPTION` | FastAPI application description. | Required | `Local ThreatLens AI backend` |
| `DEBUG` | Debug setting loaded by backend configuration. | Optional; defaults to `false` | `false` |
| `API_PREFIX` | Configured API prefix value. | Required by settings; route prefix is currently defined directly as `/api/v1`. | `/api/v1` |
| `DATABASE_URL` | SQLAlchemy and Alembic database connection URL. | Required | `postgresql+psycopg://<user>:<password>@<host>:5432/<database>` |
| `ABUSEIPDB_API_KEY` | Credential for AbuseIPDB requests. | Required by settings; needed for AbuseIPDB lookups. | `<provider_api_key>` |
| `VIRUSTOTAL_API_KEY` | Credential for VirusTotal requests. | Required by settings; needed for VirusTotal lookups. | `<provider_api_key>` |
| `JWT_SECRET_KEY` | Secret used to sign and validate JWT access tokens. | Required | `<long_random_secret>` |
| `JWT_ALGORITHM` | JWT signing algorithm. | Optional; defaults to `HS256` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiration duration. | Optional; defaults to `60` | `60` |
| `NEXT_PUBLIC_API_URL` | Optional frontend API base URL used by pages that read the variable. | Optional | `http://127.0.0.1:8000/api/v1` |

Do not use real API keys, passwords, or JWT secrets in shell history, commits, screenshots, or documentation examples.

## 6. Database Setup

### Start or create the database

The repository does not create a database and does not define a Docker database service. Create a local PostgreSQL database using the PostgreSQL installation method already approved for your environment, then construct a `DATABASE_URL` matching that database.

The backend expects SQLAlchemy to connect through Psycopg. A typical URL shape is:

```text
postgresql+psycopg://<database_user>:<database_password>@<database_host>:5432/<database_name>
```

Do not copy the placeholder values literally.

### Create tables with migrations

From `backend/`:

```bash
source .venv/bin/activate
alembic upgrade head
```

To inspect the migration state:

```bash
alembic current
```

The current migration head is the users-table revision `ea7c6b34fd11`.

### Verify the database connection

Start the backend after migrations, then call an endpoint that opens a database session. The health endpoint itself does not access the database, so it only verifies that FastAPI is running. A protected endpoint such as the following verifies database access as part of token validation, once a user exists and a valid token is available:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

Then register a local user:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/register \
	-H 'Content-Type: application/json' \
	-d '{"username":"localanalyst","email":"localanalyst@example.com","password":"<local_password>"}'
```

A successful registration confirms that the API can open a session, read the `users` table, and insert a user. Replace the password placeholder locally; do not use a real credential in shared documentation.

## 7. Running ThreatLens AI Locally

Use two terminals.

### Terminal 1: backend

```bash
cd ThreatLens-AI/backend
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload
```

Keep this terminal running at `http://127.0.0.1:8000`.

### Terminal 2: frontend

```bash
cd ThreatLens-AI/frontend
npm ci
npm run dev
```

Open the frontend at `http://localhost:3000`. No supporting service is started by the repository itself; the database must already be running and reachable through `DATABASE_URL`.

## 8. Verify the Installation

### Verify the backend process and API

Check the root status endpoint:

```bash
curl http://127.0.0.1:8000/
```

Expected fields include the configured project name, `"status": "Running"`, and the configured version.

Check the public health endpoint:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

It should return a healthy status for `ThreatLens AI Backend`.

FastAPI's interactive API documentation is also available at:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/redoc`

These are provided by FastAPI and are not custom repository routes.

### Verify the database

Run `alembic current` from `backend/` and confirm the users-table head is applied. Then use registration as described in the database section. A missing or unreachable database normally causes startup configuration or request errors because `DATABASE_URL` is used to construct the SQLAlchemy engine.

### Verify the frontend

Open `http://localhost:3000`. The application should show the login page when no browser token exists. Register a local account, sign in, and confirm that the authenticated shell loads.

The frontend's `AuthGuard` calls `GET /api/v1/auth/me` with a bearer token. Protected IOC, feed, and analysis operations also require authentication on the backend. Provider lookup and correlation additionally require valid provider keys and outbound network access.

### Verify an end-to-end analysis

After signing in, use the Correlation page at:

```text
http://localhost:3000/correlation
```

Enter an IP address and submit it. A successful result includes a threat score, threat level, provider counts, risk factors, and a summary. It also creates a row in `threat_analyses`. The saved result can then be reviewed at:

```text
http://localhost:3000/threat-analysis
```

## 9. First-Time Developer Checklist

- [ ] Clone the repository and enter `ThreatLens-AI/`.
- [ ] Confirm Python 3.10+ and a Node.js version compatible with Next.js 16.
- [ ] Create and activate `backend/.venv`.
- [ ] Install `backend/requirements.txt`.
- [ ] Create `backend/.env` with placeholder-free local configuration and provider keys.
- [ ] Create or start a PostgreSQL-compatible database.
- [ ] Run `alembic upgrade head` from `backend/`.
- [ ] Install frontend dependencies with `npm ci` from `frontend/`.
- [ ] Start Uvicorn in one terminal and Next.js in another.
- [ ] Confirm `/`, `/api/v1/health`, and `http://localhost:3000` respond.
- [ ] Register and sign in with a local analyst account.
- [ ] Run one IP correlation and confirm it appears in analysis history.

## 10. Common Setup Problems

### Backend fails during import with missing settings

**Cause:** `backend/.env` is missing, incomplete, or the command was started from outside `backend/`. `SettingsConfigDict` loads `.env` using the current working directory.

**Solution:** create `backend/.env` with every required setting and run Uvicorn and Alembic from `backend/`.

### Alembic cannot connect to the database

**Cause:** The database is stopped, `DATABASE_URL` is incorrect, credentials are invalid, or the database host is unreachable.

**Solution:** verify the database is running, check the URL scheme and database name, confirm the Psycopg-compatible URL, and rerun `alembic upgrade head` from `backend/`.

### Tables do not exist

**Cause:** The application was started without applying migrations.

**Solution:** from `backend/`, run:

```bash
alembic upgrade head
```

### Frontend loads but API requests fail

**Cause:** Uvicorn is not running on `127.0.0.1:8000`, the frontend URL points elsewhere, CORS origin does not match the browser URL, or a protected request lacks a valid token.

**Solution:** check the backend root and health URLs, use `http://localhost:3000` or `http://127.0.0.1:3000` as the frontend origin, and sign in again. The backend CORS allowlist currently contains those two origins.

The current frontend also has inconsistent API-base handling: some pages read `NEXT_PUBLIC_API_URL`, while IOC and Threat Feed use the local backend URL directly. Keep the backend at its default address for the least surprising local behavior.

### Login redirects back to the login page

**Cause:** The token is absent, expired, invalid, or the `/auth/me` request cannot reach the backend. The browser stores the token under `threatlens_access_token`.

**Solution:** confirm the backend is running, register/login again, and inspect the browser's local storage and network request. An inactive or missing database user is also rejected by `AuthGuard`.

### Threat-feed or correlation requests fail

**Cause:** Missing or invalid `ABUSEIPDB_API_KEY`/`VIRUSTOTAL_API_KEY`, provider rate limits, network access problems, provider timeouts, or an invalid IP address.

**Solution:** verify the two keys without exposing them, use a valid IPv4 or IPv6 address, and check the backend response. Provider calls have a 10-second HTTPX timeout. Correlation can continue with one provider if the other fails, but it returns `503` when both are unavailable.

### `npm ci` fails

**Cause:** Node.js/npm is too old or the lockfile and package manifest have been changed inconsistently.

**Solution:** use a current Node.js LTS release compatible with Next.js 16, run the command from `frontend/`, and do not delete or regenerate `package-lock.json` unless dependency changes are intentional.

### Docker commands do not start the project

**Cause:** The root `docker-compose.yml` is empty.

**Solution:** use the local Python, Node.js, and separately managed database steps in this guide. Docker-based setup is not currently implemented.

## Current Setup Limitations

These are repository facts rather than missing steps in this guide:

- No `.env.example` file is provided.
- No Python or Node.js version is pinned by a version-manager file or `package.json` `engines` field.
- No working Docker Compose configuration is provided.
- There are no backend test files under `backend/app/tests` in the current repository.
- The frontend settings screen does not persist configuration to the backend.
