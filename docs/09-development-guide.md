# ThreatLens AI - Development Guide

This is the day-to-day development guide for the current ThreatLens AI repository. It describes the tools and workflows that exist today, including gaps where the repository does not provide a test runner, formatter, script, or CI workflow.

## 1. Development Overview

ThreatLens AI is a two-application web project:

- **Backend:** Python with FastAPI, served by Uvicorn from `backend/app/main.py`.
- **Frontend:** Next.js 16 App Router with React 19 and TypeScript, under `frontend/src/app/`.
- **Database:** A relational database selected by `DATABASE_URL`; the dependencies and connection URL convention are PostgreSQL/Psycopg-oriented.
- **ORM:** SQLAlchemy 2.0, with models in `backend/app/models/` and queries in `backend/app/repositories/`.
- **Migrations:** Alembic under `backend/alembic/`.
- **Authentication:** bcrypt password hashing and JWT bearer tokens, implemented in `backend/app/core/security.py` and checked by `backend/app/api/dependencies.py`.
- **API architecture:** FastAPI routers under `/api/v1`, endpoint modules, services, repositories, SQLAlchemy models, and Pydantic schemas.
- **Provider integrations:** Asynchronous HTTPX calls to AbuseIPDB and VirusTotal.
- **Package managers:** `pip` for the backend and `npm` for the frontend. `frontend/package-lock.json` is committed.
- **Development tools:** Uvicorn reload mode, Alembic, Next.js development server, ESLint, TypeScript checking through the Next.js build, and Git.

The backend and frontend run as separate local processes. The root `docker-compose.yml` is empty, and there are no repository-provided scripts for starting the full stack.

## 2. Prerequisites

Install or have access to:

- Git.
- Python 3.10 or newer. The repository does not pin an exact Python version, but backend annotations such as `str | None` require Python 3.10+.
- `pip` and Python's built-in `venv` module.
- Node.js compatible with Next.js 16. The repository does not define a Node.js version or an `engines` field, so use a current Node.js LTS release supported by Next.js 16.
- `npm`, installed with Node.js.
- A running PostgreSQL-compatible database reachable through `DATABASE_URL`. The backend requirements include `psycopg` and `psycopg-binary`.
- AbuseIPDB and VirusTotal credentials for real provider lookups and correlation.
- A shell capable of running the commands in this guide. The project is currently developed on macOS; no Windows-specific scripts are provided.

No Docker installation is needed for the current supported local workflow because `docker-compose.yml` is empty and `docker/` has no configuration.

## 3. Repository Setup

### Clone and enter the repository

```bash
git clone https://github.com/Aryan457-dev/ThreatLens-AI.git
cd ThreatLens-AI
```

### Set up the backend

Run these commands from the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Create `backend/.env` locally. There is no committed `.env.example`. The required setting names are defined in `backend/app/core/config.py`:

```dotenv
APP_NAME=ThreatLens AI
APP_VERSION=0.1.0
APP_DESCRIPTION=Local ThreatLens AI backend
DEBUG=false
API_PREFIX=/api/v1
DATABASE_URL=postgresql+psycopg://<user>:<password>@<host>:5432/<database>
ABUSEIPDB_API_KEY=<your-abuseipdb-key>
VIRUSTOTAL_API_KEY=<your-virustotal-key>
JWT_SECRET_KEY=<local-random-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Use real local values in the ignored file, but never commit or document them.

Create/start the database using your local PostgreSQL-compatible database tooling, then run migrations from `backend/`:

```bash
alembic upgrade head
```

### Set up the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm ci
```

The optional frontend API setting can be placed in `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

The default local backend URL is already used by the frontend. API-base handling is not fully centralized: some pages use `NEXT_PUBLIC_API_URL`, while the IOC and Threat Feed pages contain a hard-coded local backend base.

## 4. Backend Development

### Backend layout

The backend source root is `backend/app/`:

- `backend/app/main.py`: creates the FastAPI app, configures CORS, mounts the API router, and exposes `GET /`.
- `backend/app/api/router.py`: aggregates routers under `/api/v1`.
- `backend/app/api/endpoints/`: HTTP route functions for auth, health, message, IOCs, threat feeds, and threat-analysis history.
- `backend/app/api/dependencies.py`: shared database/auth dependencies, including `get_current_user`.
- `backend/app/core/config.py`: environment-backed settings.
- `backend/app/core/security.py`: bcrypt and JWT operations.
- `backend/app/schemas/`: Pydantic request/response models.
- `backend/app/services/`: validation, auth, provider, IOC, and correlation behavior.
- `backend/app/repositories/`: SQLAlchemy queries and transaction operations.
- `backend/app/models/`: SQLAlchemy table mappings.
- `backend/app/db/database.py`: engine, session factory, declarative base, and `get_db`.
- `backend/app/validators/`: IP, domain, and IOC validation.

The directories `backend/app/middleware/`, `backend/app/utils/`, `backend/app/workers/`, and `backend/app/tests/` are currently empty. No middleware layer, worker process, shared backend utility module, or backend test suite is configured.

### Starting FastAPI

From `backend/`, with `.venv` active and `.env` present:

```bash
uvicorn app.main:app --reload
```

The default URL is `http://127.0.0.1:8000`. `app.main:app` means Uvicorn imports the `app` object from `backend/app/main.py`.

### Router organization

`backend/app/api/router.py` sets the `/api/v1` prefix and includes:

- `health.py`: public health check.
- `message.py`: public message echo.
- `auth.py`: public register/login and protected current-user lookup.
- `ioc.py`: protected IOC CRUD.
- `threat_feed.py`: protected provider lookups and feed-based analysis.
- `threat_analysis.py`: protected fresh analysis and saved-analysis history.

Add endpoint functions to the relevant module. If creating a new router module, import and include it in `backend/app/api/router.py`.

### Dependencies and database sessions

Endpoint functions obtain sessions with `db: Session = Depends(get_db)`. `get_db` in `backend/app/db/database.py` creates a `SessionLocal` session, yields it, and closes it in `finally`.

Repositories use the session for queries and explicitly commit writes. IOC and analysis repositories roll back on relevant persistence failures. Do not assume the API creates tables automatically; migrations must be applied separately.

### Services, models, and schemas

Keep responsibilities aligned with the current code:

- Endpoint modules handle HTTP parameters, dependencies, response models, and HTTP-specific checks.
- Services handle application rules, validation, provider orchestration, authentication, or scoring.
- Repositories handle SQLAlchemy queries and transaction boundaries.
- Models under `backend/app/models/` describe database tables.
- Pydantic schemas under `backend/app/schemas/` describe API input/output.

### Configuration and authentication

`backend/app/core/config.py` loads required settings from `.env` in the current working directory. Run backend and Alembic commands from `backend/` so that `.env` is found as expected.

Protected endpoints use `get_current_user` from `backend/app/api/dependencies.py`. It decodes the JWT, reads the `sub` user ID, loads the user, and rejects invalid, missing, or inactive users. The role claim is present but no role-based authorization rules are implemented.

## 5. Frontend Development

### Next.js structure

The frontend uses the Next.js App Router:

- `frontend/src/app/layout.tsx`: root layout, metadata, fonts, global CSS, and `AppShell`.
- `frontend/src/app/page.tsx`: dashboard.
- `frontend/src/app/login/page.tsx`: login.
- `frontend/src/app/register/page.tsx`: registration.
- `frontend/src/app/iocs/page.tsx`: IOC management.
- `frontend/src/app/threat-feed/page.tsx`: direct provider lookup and feed analysis.
- `frontend/src/app/threat-analysis/page.tsx`: analysis history.
- `frontend/src/app/correlation/page.tsx`: fresh correlation.
- `frontend/src/app/settings/page.tsx`: local settings controls.

These pages are client components and contain most feature-specific state and behavior.

### Components and shared code

Shared layout components are in `frontend/components/layout/`:

- `AppShell.tsx`: public/authenticated layout switch.
- `AuthGuard.tsx`: browser token validation through `/api/v1/auth/me`.
- `Header.tsx`: shared header.
- `Sidebar.tsx`: navigation.

`frontend/components/analysis/`, `frontend/components/dashboard/`, and `frontend/components/ioc/` are currently empty. Feature UI is currently colocated in route pages.

The directories `frontend/hooks/`, `frontend/lib/`, `frontend/types/`, and `frontend/utils/` are empty. The one existing frontend auth utility is `frontend/src/lib/auth.ts`, which reads/writes/removes the `threatlens_access_token` local-storage value.

### API communication

Pages use browser `fetch` directly and define local TypeScript response types. There is no shared API client, generated client, or frontend state-management library.

The backend requires bearer authentication for IOC, threat-feed, and threat-analysis routes. `AuthGuard` attaches a token when checking `/auth/me`, but several feature-page fetch calls do not currently attach the stored token. This is an existing integration gap to consider when debugging protected requests.

### Styling and configuration

- `frontend/src/app/globals.css`: Tailwind import and global styles.
- Page/component styles: primarily Tailwind utility classes.
- `frontend/postcss.config.mjs`: Tailwind PostCSS plugin.
- `frontend/next.config.ts`: currently an empty Next.js configuration object.
- `frontend/tsconfig.json`: strict TypeScript, bundler resolution, incremental compilation, and `@/*` -> `src/*` alias.
- `frontend/eslint.config.mjs`: Next.js Core Web Vitals and TypeScript ESLint configuration.

## 6. Running the Application

Use separate terminals for the backend and frontend.

### Database and migrations

From `backend/`:

```bash
source .venv/bin/activate
alembic upgrade head
```

The database server must already be running and match `DATABASE_URL`. The repository does not start a database service.

### Backend terminal

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

Expected backend URL: `http://127.0.0.1:8000`.

### Frontend terminal

```bash
cd frontend
npm run dev
```

Expected frontend URL: `http://localhost:3000`.

Available frontend commands from `frontend/`:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

`npm run start` serves a production build and normally requires `npm run build` first. No backend start script is defined; use the Uvicorn command directly.

## 7. Environment Variables

The backend settings are defined in `backend/app/core/config.py`. The frontend variable is read by selected page/auth modules.

| Variable | Used By | Purpose | Required | Example |
| --- | --- | --- | --- | --- |
| `APP_NAME` | `backend/app/core/config.py`, `backend/app/main.py` | FastAPI application name. | Yes | `ThreatLens AI` |
| `APP_VERSION` | Backend settings and root metadata | Application version. | Yes | `0.1.0` |
| `APP_DESCRIPTION` | Backend settings and FastAPI metadata | Application description. | Yes | `Local ThreatLens AI backend` |
| `DEBUG` | Backend settings | Debug setting. | No; defaults to `false` | `false` |
| `API_PREFIX` | Backend settings | Required configuration value for the configured API prefix. Current router prefix is directly defined as `/api/v1`. | Yes | `/api/v1` |
| `DATABASE_URL` | `backend/app/db/database.py`, `backend/alembic/env.py` | SQLAlchemy and Alembic database URL. | Yes | `postgresql+psycopg://<user>:<password>@<host>:5432/<database>` |
| `ABUSEIPDB_API_KEY` | `backend/app/services/threat_feed_service.py`, settings | AbuseIPDB credential. | Yes for settings initialization and provider use | `<your-abuseipdb-key>` |
| `VIRUSTOTAL_API_KEY` | `backend/app/services/virus_total_service.py`, settings | VirusTotal credential. | Yes for settings initialization and provider use | `<your-virustotal-key>` |
| `JWT_SECRET_KEY` | `backend/app/core/security.py` | JWT signing/validation secret. | Yes | `<local-random-secret>` |
| `JWT_ALGORITHM` | `backend/app/core/security.py` | JWT algorithm. | No; defaults to `HS256` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `backend/app/core/security.py` | JWT expiration duration. | No; defaults to `60` | `60` |
| `NEXT_PUBLIC_API_URL` | Selected frontend pages and `AuthGuard` | Frontend backend API base URL. | No; local defaults exist | `http://127.0.0.1:8000/api/v1` |

No `.env.example` is provided. Never put real API keys, passwords, JWT secrets, database credentials, or access tokens in this guide, source code, logs, or commits.

## 8. Development Workflow

The repository does not contain an enforced branch or CI workflow. The following is a recommended workflow using commands available in the repository:

1. Create a branch:

	```bash
	git switch -c feature/short-description
	```

2. Inspect the relevant endpoint, service, model, schema, or page before editing.
3. Make the smallest change that matches the current layer boundaries.
4. Start the required local services and exercise the changed path.
5. For database changes, generate/review a migration and apply it locally.
6. Run available checks:

	```bash
	npm run lint
	npm run build
	git diff --check
	```

7. Review the complete diff:

	```bash
	git diff --stat
	git diff
	git status --short
	```

8. Commit the intended changes, push the branch, and open a pull request according to the team's Git hosting process.

The repository has no configured backend formatter, backend lint command, backend test command, or CI workflow. Do not report those checks as passed unless the relevant tooling is added or run independently.

## 9. Adding a New API Endpoint

1. Choose the appropriate router module under `backend/app/api/endpoints/`, or create a new endpoint module.
2. Define request and response Pydantic models in the relevant file under `backend/app/schemas/`.
3. Add the route decorator and function. Declare `db: Session = Depends(get_db)` when database access is needed.
4. Add `current_user=Depends(get_current_user)` when the endpoint should be protected.
5. Put business behavior in an existing service or a new service under `backend/app/services/`.
6. Put database queries and writes in the relevant repository under `backend/app/repositories/`.
7. Add a `response_model` when the endpoint has a stable Pydantic response contract, following existing routes.
8. Register a new router in `backend/app/api/router.py`; functions added to the existing IOC/threat/auth routers need no additional registration.
9. Run the backend and verify the route through `/docs` or `curl`.
10. Update the API documentation in `docs/05-api-documentation.md`.

For protected routes, remember that backend enforcement is independent of the frontend session guard. A frontend page must send `Authorization: Bearer <token>` itself; `AuthGuard` does not inject headers into arbitrary `fetch` calls.

## 10. Adding a New Database Model

1. Add a SQLAlchemy model under `backend/app/models/` inheriting from `Base` in `backend/app/db/database.py`.
2. Import it in `backend/app/models/__init__.py` so Alembic's `target_metadata` includes it.
3. Add Pydantic schemas if the model is exposed through the API.
4. Add a repository for queries/transactions and a service for business behavior when needed.
5. Generate a migration from `backend/`:

	```bash
	alembic revision --autogenerate -m "describe model change"
	```

6. Review the generated file under `backend/alembic/versions/`, especially nullability, defaults, indexes, constraints, and foreign keys.
7. Apply it locally:

	```bash
	alembic upgrade head
	```

8. Exercise the endpoint or repository path and inspect the migration status with `alembic current`.

The current project does not call `Base.metadata.create_all`; model changes do not modify existing databases until a migration is applied.

## 11. Adding a Frontend Feature

### Add a route/page

Create a `page.tsx` under `frontend/src/app/<route>/`. Existing pages are client components and use React state/effects plus direct `fetch` calls. Add navigation in `frontend/components/layout/Sidebar.tsx` if the page belongs in the authenticated console.

### Add a reusable component

Use `frontend/components/` for shared UI. Shared shell pieces currently live in `frontend/components/layout/`. The feature folders `analysis/`, `dashboard/`, and `ioc/` are empty, so extracting page-local UI into those folders would be a new organization choice.

### Call the backend

Use the existing fetch style and the API route documented in `docs/05-api-documentation.md`. Read `NEXT_PUBLIC_API_URL` where appropriate, URL-encode path values, send JSON headers/bodies for JSON requests, and attach the bearer token for protected routes. Handle loading, error, empty, and successful states as the current pages do.

### Add types and styling

Current response types are page-local. Add a type in the page for a small feature, or introduce a shared type under `frontend/types/` if multiple pages need it. The directory is currently empty. Use Tailwind classes and update `frontend/src/app/globals.css` only for genuinely global styling.

## 12. Adding a Threat Intelligence Provider

Follow the existing provider boundary:

1. Add an asynchronous adapter under `backend/app/services/`, using HTTPX as in `threat_feed_service.py` and `virus_total_service.py`.
2. Add its credential/configuration field to `backend/app/core/config.py` and document a safe placeholder in the relevant docs.
3. Normalize provider responses in the adapter and handle timeout, HTTP, connection, and malformed-response failures with `HTTPException`.
4. Wire the adapter into `backend/app/services/threat_correlation_service.py` if it should affect scoring.
5. Update `backend/app/schemas/` and `backend/app/models/` plus an Alembic migration if new response or persisted fields are needed.
6. Add or update a route under `backend/app/api/endpoints/` if direct provider access is required.
7. Manually test success, provider error, timeout, malformed response, and partial-provider availability.

The current repository has no provider abstraction interface, mock provider suite, background ingestion, or automated backend test infrastructure.

## 13. Testing

### Backend tests

`backend/app/tests/` is currently empty. No backend test framework or test command is declared in the repository. Do not use a nonexistent `pytest` command as an established project command.

### Frontend tests

No frontend test files or frontend test runner are configured. `frontend/package.json` provides linting, building, development, and production-start commands only.

### Available checks

The configured frontend checks are:

```bash
cd frontend
npm run lint
npm run build
```

`npm run build` is also the available practical TypeScript/Next.js compilation check because `tsconfig.json` has `noEmit: true` and no standalone typecheck script exists.

For API behavior, use the running FastAPI server, its `/docs` interface, and `curl` requests. For database behavior, apply Alembic migrations and exercise a database-backed route. For provider behavior, use configured credentials or add test tooling that mocks the HTTPX boundary; do not depend on live providers for repeatable automated tests.

## 14. Code Quality

### Configured tools

- Frontend ESLint is configured in `frontend/eslint.config.mjs` and runs with `npm run lint`.
- Frontend TypeScript is configured strictly in `frontend/tsconfig.json`; `npm run build` performs the practical compile check.
- Backend request validation uses Pydantic schemas.
- Backend IOC/IP validation uses `backend/app/validators/`.
- Alembic validates the migration chain when migrations are run against a reachable database.
- `git diff --check` detects whitespace errors in changed files.

### Not configured

- No backend formatter configuration is present.
- No backend linter configuration or script is present.
- No frontend formatter configuration or script is present.
- No test runner is configured for either application.
- No CI workflow is present under `.github/workflows/`; only `.gitkeep` exists.

Preserve the existing local style and avoid adding unrelated formatting churn when changing code.

## 15. Debugging

### FastAPI/backend

- Run `uvicorn app.main:app --reload` from `backend/` to get reload-on-change behavior.
- Check `http://127.0.0.1:8000/docs` for the generated route schema and manual requests.
- Check `/` and `/api/v1/health` to distinguish a running process from feature/database behavior.
- Read the Uvicorn/SQLAlchemy logs. The SQLAlchemy engine in `backend/app/db/database.py` uses `echo=True`.
- Trace a request from its endpoint module to its service and repository.

### Frontend/Next.js

- Run `npm run dev` from `frontend/`.
- Inspect the browser console and Network panel for `fetch` URL, status, response body, and missing authorization headers.
- Use `npm run lint` for ESLint issues and `npm run build` for TypeScript/Next.js compilation issues.
- Check the matching page under `frontend/src/app/` and the shared shell under `frontend/components/layout/`.

### API requests

Confirm the URL base and route prefix. The backend uses `/api/v1`; the local backend host is `127.0.0.1:8000`. Protected endpoints require `Authorization: Bearer <token>`. A successful `AuthGuard` check does not automatically authenticate other frontend fetch calls.

### Database

- Confirm `DATABASE_URL` is present in `backend/.env`.
- Run `alembic current` and `alembic heads` from `backend/`.
- Run `alembic upgrade head` after checking the database is reachable.
- Remember that `/api/v1/health` is static and does not prove database connectivity; registration or a protected database-backed route is a better check.
- Review SQLAlchemy output because `echo=True` is enabled.

### Authentication

Trace login through `backend/app/services/auth_service.py`, token creation/decoding through `backend/app/core/security.py`, and active-user validation through `backend/app/api/dependencies.py`. On the frontend, inspect the `threatlens_access_token` local-storage entry and the `/api/v1/auth/me` request.

### External providers

Check provider credentials, network access, provider HTTP status, and the ten-second HTTPX timeout. AbuseIPDB errors originate in `ThreatFeedService.check_ip`; VirusTotal errors originate in `VirusTotalService.check_ip`. Correlation catches provider failures independently and can return a result when one provider succeeds.

## 16. Developer Checklist

- [ ] Backend starts with `uvicorn app.main:app --reload` from `backend/`.
- [ ] Frontend starts with `npm run dev` from `frontend/`.
- [ ] Required database migrations are applied with `alembic upgrade head`.
- [ ] Backend changes were exercised through `/docs`, `curl`, or the relevant frontend flow.
- [ ] Frontend changes were checked in the browser and with `npm run lint`.
- [ ] `npm run build` passes when frontend code or configuration changes.
- [ ] Database changes include a reviewed Alembic migration.
- [ ] New environment variables are documented with safe placeholders.
- [ ] No secrets, passwords, API keys, or access tokens are committed.
- [ ] API changes are reflected in `docs/05-api-documentation.md`.
- [ ] `git diff --check` passes.
- [ ] `git diff` and `git status --short` were reviewed.
- [ ] Relevant manual checks or available automated checks were run.

## 17. Common Development Mistakes

- Running Uvicorn or Alembic outside `backend/`, which can prevent the `.env` file from being found as configured.
- Expecting the empty `docker-compose.yml` to start PostgreSQL or the application.
- Starting the backend without applying Alembic migrations; the application does not create tables automatically.
- Forgetting that backend settings require provider keys at configuration initialization, even for routes that do not call a provider.
- Calling protected backend routes from a new frontend feature without sending the stored bearer token.
- Assuming `GET /api/v1/health` verifies the database or provider integrations; it is a static health response.
- Assuming IOC creation automatically performs threat analysis; it does not.
- Treating frontend `URL` or `HASH` IOC choices as fully validated provider-supported types; backend type-specific validation currently covers only `IP` and `DOMAIN`.
- Editing a SQLAlchemy model without adding and applying an Alembic migration.
- Assuming analysis records belong to an IOC or user; the current database has no such foreign keys.
- Expecting an analysis `threat_level` to update the stored IOC; correlation saves a separate `ThreatAnalysis` record.
- Relying on a backend test command or CI check that does not exist in this repository.
- Committing `backend/.env`, frontend environment files, generated dependencies, or tokens.

## 18. Current Development Limitations

- Exact Python and Node.js versions are not pinned by repository version files or package engine declarations.
- No `.env.example` is provided.
- No backend or frontend automated tests are configured.
- No backend formatter, backend linter, or frontend formatter is configured.
- No CI workflow is defined under `.github/workflows/`.
- No helper scripts exist under `scripts/`; Docker directories/configuration are empty.
- Frontend API communication is not centralized, and some protected requests omit bearer authentication headers.
- The settings page changes local UI state and does not persist configuration.
- There is no background worker or scheduled provider ingestion.
- Threat assessment is deterministic rule-based scoring, not ML/LLM inference.
- Provider access depends on external credentials, network availability, rate limits, and ten-second request timeouts.
- Database relationships, ownership, role-based authorization, audit history, and analysis-to-IOC links are not implemented.

When a change depends on one of these missing capabilities, document it as new work and update the relevant setup, API, database, or architecture documentation alongside the implementation.
