# ThreatLens AI - Project Structure

This guide maps the current repository so a new developer can quickly find the code responsible for a feature. It describes files that exist today; empty directories are called out as extension points rather than presented as implemented modules.

## 1. Repository Overview

The repository contains a Python/FastAPI backend, a Next.js frontend, Alembic migrations, and numbered developer documentation.

```text
ThreatLens-AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies.py
│   │   │   ├── router.py
│   │   │   └── endpoints/
│   │   │       ├── auth.py
│   │   │       ├── health.py
│   │   │       ├── ioc.py
│   │   │       ├── message.py
│   │   │       ├── threat_analysis.py
│   │   │       └── threat_feed.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db/database.py
│   │   ├── models/
│   │   │   ├── ioc.py
│   │   │   ├── threat_analysis.py
│   │   │   └── user.py
│   │   ├── repositories/
│   │   │   ├── ioc_repository.py
│   │   │   ├── threat_analysis_repository.py
│   │   │   └── user_repository.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── health.py
│   │   │   ├── ioc.py
│   │   │   ├── message.py
│   │   │   └── threat_analysis.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── ioc_service.py
│   │   │   ├── threat_correlation_service.py
│   │   │   ├── threat_feed_service.py
│   │   │   └── virus_total_service.py
│   │   ├── validators/
│   │   │   ├── ioc_validator.py
│   │   │   └── ip_validator.py
│   │   ├── main.py
│   │   ├── middleware/       # currently empty
│   │   ├── tests/            # currently empty
│   │   ├── utils/             # currently empty
│   │   └── workers/           # currently empty
│   ├── alembic/
│   │   ├── env.py
│   │   ├── README
│   │   ├── script.py.mako
│   │   └── versions/
│   │       ├── 71eef07d67a8_create_iocs_table.py
│   │       ├── 59e8f28a5c03_create_threat_analyses_table.py
│   │       └── ea7c6b34fd11_add_users_table.py
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env                    # local, ignored configuration; not committed
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── correlation/page.tsx
│   │   ├── iocs/page.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── threat-analysis/page.tsx
│   │   └── threat-feed/page.tsx
│   ├── components/layout/
│   │   ├── AppShell.tsx
│   │   ├── AuthGuard.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── components/analysis/   # currently empty
│   ├── components/dashboard/  # currently empty
│   ├── components/ioc/        # currently empty
│   ├── src/lib/auth.ts
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   └── postcss.config.mjs
├── docs/
├── docker-compose.yml         # currently empty
├── docker/                    # currently empty
├── scripts/                   # currently empty
├── .github/workflows/.gitkeep
├── README.md                  # currently empty
└── LICENSE
```

Generated or local directories such as `backend/.venv`, `frontend/node_modules`, and `frontend/.next` are not source locations and are ignored by Git.

## 2. Backend Structure

The backend package root is `backend/app/`. Start at `backend/app/main.py` when tracing application startup, then follow the API router into endpoint, service, repository, and model code.

### Application entrypoint and package layout

- `backend/app/main.py` creates the FastAPI application, reads application metadata from settings, enables CORS for the two local frontend origins, includes the API router, and exposes `GET /` with basic status metadata.
- `backend/app/__init__.py` is the package initializer and is empty.
- `backend/app/api/__init__.py` and `backend/app/api/endpoints/__init__.py` are package initializers and are empty.

### API package

- `backend/app/api/router.py` creates the `/api/v1` router and includes all endpoint routers.
- `backend/app/api/dependencies.py` contains shared FastAPI dependencies: `get_current_user` validates a JWT bearer token, loads its user from the database, and rejects invalid or inactive accounts; `get_db` is imported from the database package for request sessions.
- `backend/app/api/endpoints/auth.py` owns registration, login, and current-user HTTP routes.
- `backend/app/api/endpoints/health.py` owns the public health check.
- `backend/app/api/endpoints/ioc.py` owns authenticated IOC create, list, detail, update, and delete routes.
- `backend/app/api/endpoints/message.py` owns the simple public message echo route.
- `backend/app/api/endpoints/threat_feed.py` owns authenticated direct AbuseIPDB lookup, direct VirusTotal lookup, and validated feed-based analysis routes.
- `backend/app/api/endpoints/threat_analysis.py` owns authenticated fresh-analysis and saved-analysis-history routes.

Endpoint functions are the HTTP layer. They receive Pydantic request data and FastAPI dependencies, then delegate to services or repositories. There is no separate controller class.

### Core configuration and security

- `backend/app/core/config.py` defines the Pydantic `Settings` class. It loads `.env` and provides application metadata, database URL, provider keys, and JWT settings.
- `backend/app/core/security.py` provides bcrypt password hashing/verification and JWT creation/decoding. Tokens contain the user ID, username, role, and expiration.

### Services

Services contain application behavior between endpoint functions and lower-level adapters:

- `backend/app/services/auth_service.py` checks username/email uniqueness, hashes passwords, verifies login credentials, and creates JWT access tokens.
- `backend/app/services/ioc_service.py` validates IP and domain IOC values and delegates IOC persistence and queries to `IOCRepository`.
- `backend/app/services/threat_feed_service.py` calls AbuseIPDB through `check_ip`. It also contains a duplicate VirusTotal method, but the active threat-feed route uses `VirusTotalService` instead.
- `backend/app/services/virus_total_service.py` calls VirusTotal's IP endpoint and normalizes provider data into the fields used by the application.
- `backend/app/services/threat_correlation_service.py` calls both active provider services independently, calculates source and final scores, assigns a threat level, creates risk factors and a summary, persists the result, and returns the unified analysis payload.

### Repositories

Repositories own database queries, duplicate checks, commits, refreshes, and rollbacks:

- `backend/app/repositories/user_repository.py` looks up users by ID, username, or email and creates users.
- `backend/app/repositories/ioc_repository.py` performs IOC CRUD, uniqueness checks, filtering, search, sorting, and pagination.
- `backend/app/repositories/threat_analysis_repository.py` creates analyses and retrieves recent analyses or the history for one IP.

### Models

SQLAlchemy models map Python objects to database tables:

- `backend/app/models/user.py` maps `users`, including unique username/email, password hash, role, active state, and creation time.
- `backend/app/models/ioc.py` maps `iocs`, including unique value, type, source, threat level, and creation time.
- `backend/app/models/threat_analysis.py` maps `threat_analyses`, including IP, score, threat level, provider counts, JSON risk factors, summary, and creation time.
- `backend/app/models/__init__.py` imports all three models so Alembic can discover them.

### Schemas

Pydantic schemas define request validation and response serialization:

- `backend/app/schemas/auth.py` defines registration, login, user response, and token response models.
- `backend/app/schemas/health.py` defines the health response.
- `backend/app/schemas/ioc.py` defines IOC create/update/response models.
- `backend/app/schemas/message.py` defines the message request and response.
- `backend/app/schemas/threat_analysis.py` defines nested AbuseIPDB, VirusTotal, analysis, and unified threat-analysis responses.

### Validators and empty packages

- `backend/app/validators/ip_validator.py` validates IPv4 and IPv6 addresses with Python's `ipaddress` module.
- `backend/app/validators/ioc_validator.py` validates IPv4/IPv6 values and domain names. It is called by `IOCService` for `IP` and `DOMAIN` IOC types.
- `backend/app/middleware/`, `backend/app/utils/`, `backend/app/workers/`, and `backend/app/tests/` currently contain no implementation files. No middleware, shared backend utility layer, worker process, or backend test suite is currently present.

## 3. Frontend Structure

The frontend is a Next.js App Router application under `frontend/`. The current feature behavior is mostly implemented directly in route page files rather than in feature components.

### App routes and pages

- `frontend/src/app/layout.tsx` defines the root HTML layout, metadata, Google font setup, global stylesheet import, and `AppShell` wrapper.
- `frontend/src/app/page.tsx` is the dashboard. It fetches IOC and analysis lists and derives summary statistics and threat-level distributions.
- `frontend/src/app/login/page.tsx` submits credentials to the backend and stores the returned token and user object in browser local storage.
- `frontend/src/app/register/page.tsx` submits a new username, email, and password to the registration endpoint.
- `frontend/src/app/iocs/page.tsx` handles IOC listing, local search, filters, add/edit/detail/delete UI, and initiating analysis for an IOC.
- `frontend/src/app/threat-feed/page.tsx` queries AbuseIPDB and VirusTotal for an entered IP and can request a feed-based correlation result.
- `frontend/src/app/threat-analysis/page.tsx` loads saved analysis records, searches by IP, and displays the selected record.
- `frontend/src/app/correlation/page.tsx` submits a fresh IP analysis request and renders its score, threat level, provider values, risk factors, and summary.
- `frontend/src/app/settings/page.tsx` renders API, analysis, data-source, and notification controls. These controls currently use local React state and do not persist to the backend.
- `frontend/src/app/globals.css` imports Tailwind CSS and defines global colors, sizing, body styling, form font inheritance, and scrollbar styling.

Each page is a client component and uses React state/effects plus browser `fetch`. There is no shared API client, generated client, or frontend state-management package.

### Components

Reusable components currently exist only under `frontend/components/layout/`:

- `frontend/components/layout/AppShell.tsx` switches between public auth pages and the authenticated sidebar/header shell.
- `frontend/components/layout/AuthGuard.tsx` checks the browser token and validates it against `/api/v1/auth/me` before rendering protected pages.
- `frontend/components/layout/Header.tsx` renders the shared header.
- `frontend/components/layout/Sidebar.tsx` renders navigation links and the system-status block.

The directories `frontend/components/analysis/`, `frontend/components/dashboard/`, and `frontend/components/ioc/` are currently empty. Feature-specific UI is therefore still colocated in the route pages.

### Hooks, libraries, types, and utilities

- `frontend/hooks/` is currently empty; no custom React hooks are implemented there.
- `frontend/lib/` is currently empty. Authentication helpers are instead located at `frontend/src/lib/auth.ts`.
- `frontend/src/lib/auth.ts` provides `saveToken`, `getToken`, `removeToken`, and `isAuthenticated` for the `threatlens_access_token` local-storage key.
- `frontend/types/` and `frontend/utils/` are currently empty.
- Page-local TypeScript types for IOC and threat-analysis response shapes are declared inside the relevant page files.
- `frontend/public/` contains static assets; the current tree has no application feature module there.

### Frontend configuration

- `frontend/package.json` defines `dev`, `build`, `start`, and `lint` scripts and declares the Next.js, React, TypeScript, Tailwind, icon, and chart dependencies.
- `frontend/package-lock.json` locks npm dependency resolution.
- `frontend/next.config.ts` exports an otherwise empty Next.js configuration object.
- `frontend/tsconfig.json` enables strict TypeScript checking, bundler module resolution, JSX, incremental compilation, and the `@/*` path alias to `src/*`.
- `frontend/eslint.config.mjs` combines Next.js Core Web Vitals and TypeScript ESLint configurations.
- `frontend/postcss.config.mjs` enables the Tailwind CSS PostCSS plugin.
- `frontend/src/app/globals.css` is the styling entrypoint; page and component styling primarily uses Tailwind utility classes.

The optional `NEXT_PUBLIC_API_URL` environment variable is read by some pages. IOC and Threat Feed pages currently retain a hard-coded local backend base URL, so API-base configuration is not fully centralized.

## 4. Database-Related Files

Database access and schema evolution are split across these locations:

- `backend/app/db/database.py` creates the SQLAlchemy engine from `settings.DATABASE_URL`, creates `SessionLocal`, defines the declarative `Base`, and provides the `get_db` session dependency.
- `backend/app/models/` contains the `User`, `IOC`, and `ThreatAnalysis` table mappings.
- `backend/app/repositories/` contains query and transaction code for each model area.
- `backend/alembic.ini` points Alembic at the migration script directory.
- `backend/alembic/env.py` loads application settings, replaces Alembic's blank URL with `settings.DATABASE_URL`, imports all models, and configures target metadata for migrations.
- `backend/alembic/versions/` contains the migration history for IOC, threat-analysis, and user tables.
- `backend/alembic/script.py.mako` is Alembic's migration-file template.
- `backend/alembic/README` contains the generic Alembic configuration note.

There are no model relationships or foreign keys connecting users, IOCs, and threat analyses in the current schema. Analysis records are not linked to the user who initiated them or to an IOC record.

## 5. Threat Intelligence Components

Use the following locations when tracing threat-intelligence behavior:

- **IOC handling:** `backend/app/api/endpoints/ioc.py` -> `backend/app/services/ioc_service.py` -> `backend/app/validators/ioc_validator.py` -> `backend/app/repositories/ioc_repository.py` -> `backend/app/models/ioc.py`.
- **AbuseIPDB feed:** `backend/app/services/threat_feed_service.py`.
- **VirusTotal feed:** `backend/app/services/virus_total_service.py`.
- **Feed routes:** `backend/app/api/endpoints/threat_feed.py`.
- **Analysis routes and history:** `backend/app/api/endpoints/threat_analysis.py` and `backend/app/repositories/threat_analysis_repository.py`.
- **Correlation orchestration:** `backend/app/services/threat_correlation_service.py`.
- **Scoring:** the scoring rules are implemented directly in `ThreatCorrelationService`, including AbuseIPDB weighting, VirusTotal engine points, final source weighting, and severity thresholds.
- **Analysis persistence:** `backend/app/repositories/threat_analysis_repository.py` and `backend/app/models/threat_analysis.py`.
- **Frontend investigation views:** `frontend/src/app/threat-feed/page.tsx`, `frontend/src/app/correlation/page.tsx`, and `frontend/src/app/threat-analysis/page.tsx`.

There is no separate ML/LLM module, scheduled ingestion process, alert worker, or generic correlation framework in the current tree.

## 6. Configuration and Environment Files

- `backend/.env` is a local ignored file containing backend settings. Do not read, copy, commit, or document its secret values.
- `backend/app/core/config.py` defines the names and defaults consumed from the backend environment: application metadata, `DATABASE_URL`, provider API keys, and JWT settings.
- `frontend/.env.local` can supply `NEXT_PUBLIC_API_URL` locally, although not every page reads it.
- `backend/.gitignore` ignores Python caches, virtual environments, environment files, IDE files, logs, and test/build artifacts.
- `frontend/.gitignore` ignores dependencies, Next.js output, environment files, logs, and TypeScript build information.
- The root `docker-compose.yml` is empty, and `docker/` is empty. No container configuration is currently available.

Do not put API keys, database passwords, JWT secrets, or real user credentials in source files, documentation, or committed environment examples.

## 7. Documentation and Supporting Files

### Documentation

`docs/` contains numbered developer documentation:

- `docs/01-project-overview.md`: product purpose, implemented features, workflow, stack, status, and terminology.
- `docs/02-architecture.md`: current system architecture and data flows.
- `docs/03-setup-guide.md`: local development setup.
- `docs/04-project-structure.md`: this repository map.
- `docs/05-api-documentation.md` through `docs/12-troubleshooting.md`: named documentation areas that exist in the repository. Their content should be checked before relying on them; this structure guide does not assume functionality that is not in source code.

### Supporting files

- `backend/requirements.txt` pins the Python backend dependencies.
- `frontend/package.json` and `frontend/package-lock.json` define and lock frontend dependencies and scripts.
- `docker-compose.yml` exists at the root but is empty. `docker/` is empty, so Docker is not a current application setup path.
- `scripts/` is empty; there are no repository-provided helper scripts.
- `.github/workflows/.gitkeep` keeps the workflows directory in the repository, but there are no workflow definitions currently present.
- `README.md` exists at the root but is currently empty.
- `frontend/README.md` is the default create-next-app README and describes generic Next.js usage rather than ThreatLens-specific architecture.
- `LICENSE` contains the repository license.

## Where Should I Make Changes?

| I want to... | Where should I look? |
| --- | --- |
| Add an API endpoint | Add or modify a router module in `backend/app/api/endpoints/`, then include a new router in `backend/app/api/router.py` if needed. |
| Add shared request authentication or database dependencies | `backend/app/api/dependencies.py`. |
| Modify IOC processing | `backend/app/services/ioc_service.py`, `backend/app/validators/ioc_validator.py`, and `backend/app/repositories/ioc_repository.py`. |
| Change threat analysis | `backend/app/services/threat_correlation_service.py` for orchestration, scoring, risk factors, and summaries; `backend/app/schemas/threat_analysis.py` for the API response shape. |
| Change a threat provider integration | `backend/app/services/threat_feed_service.py` for AbuseIPDB or `backend/app/services/virus_total_service.py` for the active VirusTotal adapter. |
| Modify database models | The relevant file under `backend/app/models/`, then add an Alembic revision under `backend/alembic/versions/`. |
| Change database queries or transactions | The relevant repository under `backend/app/repositories/`. |
| Change API request/response validation | The relevant Pydantic module under `backend/app/schemas/`. |
| Change authentication or token behavior | `backend/app/services/auth_service.py`, `backend/app/core/security.py`, and `backend/app/api/dependencies.py`. |
| Change frontend UI for an existing route | The matching page under `frontend/src/app/`. |
| Add a frontend component | `frontend/components/`; use `frontend/components/layout/` for shared shell components or create a feature folder when extracting page-local UI. |
| Add a custom frontend hook | `frontend/hooks/` (currently empty). |
| Add shared frontend types | `frontend/types/` (currently empty), or `frontend/src/lib/` for a shared client/helper if that abstraction is introduced. |
| Change frontend authentication storage helpers | `frontend/src/lib/auth.ts` and `frontend/components/layout/AuthGuard.tsx`. |
| Change frontend API base configuration | `frontend/.env.local` / `NEXT_PUBLIC_API_URL` and the page code that reads it; note that some pages currently use a hard-coded local URL. |
| Change global styling | `frontend/src/app/globals.css`; route-specific styling is in the relevant page file. |
| Change frontend build, lint, or dependency configuration | `frontend/package.json`, `frontend/package-lock.json`, `frontend/next.config.ts`, `frontend/tsconfig.json`, `frontend/eslint.config.mjs`, or `frontend/postcss.config.mjs` as appropriate. |
| Add backend tests | `backend/app/tests/` (currently empty). |
| Add documentation | The relevant numbered file under `docs/`. |
