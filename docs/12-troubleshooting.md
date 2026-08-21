# ThreatLens AI - Troubleshooting Guide

This guide covers practical failures in the current ThreatLens AI repository. It is based on the implemented FastAPI backend, Next.js frontend, SQLAlchemy/Alembic setup, provider adapters, and Git configuration. It does not assume Docker, CI/CD, background workers, cloud infrastructure, or automated tests that are not present.

## 1. Troubleshooting Overview

The local application normally has three independently managed pieces:

1. A database reachable through `DATABASE_URL`.
2. A FastAPI backend at `http://127.0.0.1:8000`.
3. A Next.js frontend at `http://localhost:3000`.

Start diagnosis at the first failing boundary:

```text
configuration -> Python dependencies -> database/migrations
-> backend process -> browser/API URL and CORS -> authentication
-> external provider -> feature-specific behavior
```

The backend logs SQL because `create_engine(..., echo=True)` is configured in `backend/app/db/database.py`. Avoid sharing logs that contain sensitive values.

## 2. Backend Startup Failures

### Symptom: Uvicorn cannot import `app.main`

**Likely causes:** The command was run outside `backend/`, the virtual environment is not active, dependencies are missing, or required settings failed during import.

**Diagnose:**

```bash
cd backend
source .venv/bin/activate
python --version
python -c "import app.main; print('backend import OK')"
```

Read the first traceback error, not only the final Uvicorn message.

**Fix:** Run from `backend/`, activate/recreate `.venv`, install `requirements.txt`, and create a complete local `.env`. `backend/app/core/config.py` requires application metadata, `API_PREFIX`, `DATABASE_URL`, both provider keys, and `JWT_SECRET_KEY`.

### Symptom: Backend starts but requests fail with database errors

**Likely cause:** The engine is created from an invalid/unreachable `DATABASE_URL`, or migrations have not been applied.

**Diagnose:**

```bash
cd backend
alembic current
```

**Fix:** Verify the database is running and the URL uses the Psycopg-compatible form, then run `alembic upgrade head`.

## 3. Frontend Startup Failures

### Symptom: `npm run dev` or `npm run build` cannot start

**Likely causes:** Node.js/npm is too old for the declared Next.js version, dependencies are absent, or the lockfile and dependency manifest are inconsistent.

**Diagnose:**

```bash
cd frontend
node --version
npm --version
npm ci
npm run lint
npm run build
```

The repository does not pin an exact Node.js version; `frontend/package.json` declares Next.js `16.3.0` and React `19.2.8`.

**Fix:** Use a current Node.js LTS release compatible with Next.js 16, run `npm ci` from `frontend/`, and keep `package-lock.json` aligned with `package.json`.

### Symptom: Browser shows an empty/error page after the frontend starts

**Likely causes:** A page runtime error, failed browser fetch, or unauthenticated route redirect.

**Diagnose:** Inspect the browser console and Network panel, then check the terminal running Next.js. Try `http://localhost:3000/login` directly.

**Fix:** Resolve the page error or API failure. Protected pages redirect through `frontend/components/layout/AuthGuard.tsx` when there is no valid token.

## 4. Python Virtual Environment Problems

### Symptom: `python` or installed packages are missing

**Likely cause:** `.venv` is not active, or it was created with an unsuitable interpreter.

**Diagnose:**

```bash
cd backend
source .venv/bin/activate
which python
python --version
python -m pip show fastapi sqlalchemy alembic
```

**Fix:** Recreate and install the backend environment:

```bash
cd backend
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Only remove `.venv` after confirming it is a local generated environment. The directory is ignored by Git.

### Symptom: Shell keeps using another Python

**Likely cause:** The environment was not activated in the current terminal.

**Fix:** Run `source backend/.venv/bin/activate` from the repository root, or use `backend/.venv/bin/python` explicitly.

## 5. Python Dependency or Import Errors

### Symptom: `ModuleNotFoundError`

**Likely cause:** Packages were installed globally or into another virtual environment.

**Diagnose:**

```bash
cd backend
source .venv/bin/activate
python -c "import fastapi, sqlalchemy, alembic, httpx; print('imports OK')"
python -m pip list
```

**Fix:** Install with the active interpreter:

```bash
python -m pip install -r requirements.txt
```

### Symptom: Backend import fails before a route is called

**Likely cause:** `settings = Settings()` runs during import in `backend/app/core/config.py`; missing required environment values prevent application import.

**Fix:** Add all required setting names to `backend/.env` without exposing values, then retry the import check from `backend/`.

## 6. Node.js/npm Dependency Problems

### Symptom: `npm ci` reports a lockfile mismatch

**Likely cause:** `package.json` and `package-lock.json` describe different dependency trees.

**Diagnose:** Run `npm ci` from `frontend/` and inspect the package names in the error.

**Fix:** Preserve unrelated work. If dependency changes are intentional, use `npm install` to update the lockfile, review the diff, and commit both manifests.

### Symptom: `next`, `eslint`, or another frontend command is missing

**Likely cause:** `frontend/node_modules` is absent or incomplete.

**Fix:**

```bash
cd frontend
npm ci
```

Do not commit `node_modules`; it is ignored by `frontend/.gitignore`.

## 7. Database Connection Failures

### Symptom: SQLAlchemy cannot connect

**Likely causes:** Database is stopped, host/port/database/user is wrong, credentials are invalid, or the URL is malformed.

**Diagnose:**

```bash
cd backend
alembic current
```

Inspect the connection exception, verify the database independently with approved local tooling, and confirm `DATABASE_URL` is available from `backend/.env`.

**Fix:** Start the separately managed PostgreSQL-compatible database, correct the URL, and rerun `alembic upgrade head`. The repository does not start a database service.

### Symptom: Health succeeds but database-backed requests fail

**Likely cause:** `GET /api/v1/health` is static and does not query the database.

**Diagnose:** Register a local user or call a protected route after obtaining a token. Check the backend SQLAlchemy traceback.

**Fix:** Repair the database connection and migrations; do not treat the health response as a database readiness check.

## 8. Alembic Migration Problems

### Symptom: `alembic` cannot find the application or settings

**Likely cause:** Command was run outside `backend/`, `.venv` is inactive, or `.env` is not found.

**Diagnose:**

```bash
cd backend
python -c "from app.core.config import settings; print(settings.APP_NAME)"
alembic current
```

**Fix:** Run Alembic from `backend/` with the active virtual environment and complete `.env`.

### Symptom: Tables do not exist

**Likely cause:** Migrations were not applied.

**Fix:**

```bash
cd backend
alembic upgrade head
```

The checked-in chain creates `iocs`, `threat_analyses`, and `users`.

### Symptom: Migration is behind or has multiple heads

**Diagnose:**

```bash
cd backend
alembic current
alembic heads
```

**Fix:** Apply the intended chain with `alembic upgrade head`. If a new migration was created, review its `upgrade()` and `downgrade()` before applying. The repository currently has a linear chain ending at the users migration.

### Symptom: Autogenerated migration misses a model

**Likely cause:** The model was not imported into `backend/app/models/__init__.py`, so Alembic's `Base.metadata` cannot see it.

**Fix:** Import the model, then run:

```bash
alembic revision --autogenerate -m "describe schema change"
```

Review generated DDL manually, especially nullability, defaults, indexes, and foreign keys.

## 9. Authentication and JWT Problems

### Symptom: Protected API route returns `401`

**Likely causes:** No bearer header, invalid/expired token, malformed `sub` claim, or no matching database user.

**Diagnose:** Login and call:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"<username>","password":"<local_password>"}'

curl http://127.0.0.1:8000/api/v1/auth/me \
  -H 'Authorization: Bearer <jwt_access_token>'
```

Use placeholders only; do not log or share real credentials or tokens.

**Fix:** Send `Authorization: Bearer <token>`, ensure `JWT_SECRET_KEY` is stable for the running backend, and log in again after changing it.

### Symptom: Login returns `401`

**Likely cause:** Username does not exist or password verification fails.

**Fix:** Register a local account with `POST /api/v1/auth/register`, use the exact username, and meet the 8-128 character password rule.

### Symptom: Login or session returns `403`

**Likely cause:** The database user has `is_active=false`.

**Fix:** Check the local user record through approved database administration tools. The current API has no account-management endpoint for changing active state.

### Symptom: Frontend redirects repeatedly to `/login`

**Likely causes:** Missing local-storage token, invalid token, backend unreachable, or `/auth/me` returns an error.

**Diagnose:** Inspect browser local storage key `threatlens_access_token`, the Network panel, and backend logs.

**Fix:** Start the backend, log in again, and verify `/api/v1/auth/me`. `AuthGuard` removes the token when validation fails.

## 10. AbuseIPDB Integration Failures

### Symptom: AbuseIPDB lookup returns an error

**Likely causes:** Invalid/missing provider credential, provider HTTP error, network failure, or timeout.

**Diagnose:** Inspect the backend response and logs. The adapter is `ThreatFeedService.check_ip` in `backend/app/services/threat_feed_service.py`.

**Fix:** Verify `ABUSEIPDB_API_KEY` without displaying it, confirm outbound HTTPS access, and retry with a valid IP. The request timeout is 10 seconds.

Actual adapter errors are `504` for timeout, the provider HTTP status for `HTTPStatusError`, and `503` for `RequestError`.

### Symptom: Correlation says AbuseIPDB is unavailable but still returns a result

**Cause:** `ThreatCorrelationService` catches that provider failure and continues when VirusTotal succeeds.

**Fix/workaround:** Inspect `risk_factors` and the recorded error detail. Treat the result as a partial-provider assessment.

## 11. VirusTotal Integration Failures

### Symptom: VirusTotal lookup fails

**Likely causes:** Invalid/missing key, provider HTTP error, network failure, timeout, or unexpected response structure.

**Diagnose:** Inspect the backend response and `VirusTotalService.check_ip` in `backend/app/services/virus_total_service.py`.

**Fix:** Verify `VIRUSTOTAL_API_KEY` without exposing it, confirm outbound HTTPS, and retry with a valid IP. The adapter uses a 10-second timeout.

Actual adapter errors are `504` for timeout, the provider HTTP status for HTTP failure, `503` for connection/request failure, and `502` with `Unexpected response received from VirusTotal.` for missing/invalid expected response keys.

## 12. Threat Analysis and Correlation Failures

### Symptom: Correlation returns `503`

**Likely cause:** Both provider calls returned no successful result.

**Diagnose:** Check provider credentials, outbound network, provider rate limits, and backend logs. The service is `ThreatCorrelationService.analyze_ip`.

**Fix:** Restore at least one provider, then retry. No analysis is persisted when both providers fail.

### Symptom: Analysis result is unexpectedly low or partial

**Likely cause:** One provider failed, missing provider fields defaulted to zero, or the fixed scoring rules produced that level.

**Diagnose:** Inspect `abuseipdb`, `virustotal`, `analysis.risk_factors`, and `analysis.summary`. Compare the values with `backend/app/services/threat_correlation_service.py`.

**Fix/workaround:** Treat unavailable-provider risk factors as meaningful context. The service uses the successful source alone when only one provider responds.

### Symptom: Invalid input reaches a provider

**Cause:** Only `GET /api/v1/threat-feed/analyze/{ip}` explicitly calls `validate_ip`. Direct feed routes and `POST /api/v1/threat-analysis/{ip}/analyze` do not perform that endpoint-level validation.

**Fix/workaround:** Validate at the client or use the validated feed-analysis route. This is current behavior.

## 13. IOC Creation, Update, and Deletion Problems

### Symptom: IOC create/update returns `400`

**Likely cause:** A value declared as `IP` is not a valid IPv4/IPv6 address, or a value declared as `DOMAIN` fails the current domain regular expression.

**Diagnose:** Check the exact `value` and case-insensitive `type` sent in the JSON body.

**Fix:** Use a valid IP/domain or choose a type intentionally. Other type strings receive no type-specific backend validation.

### Symptom: IOC create/update returns `409`

**Likely cause:** `IOC.value` is unique and another record already uses the value.

**Diagnose:** List/search IOCs or inspect the database through approved tools.

**Fix:** Use another value or update the existing record. The repository also catches a database `IntegrityError` race.

### Symptom: IOC get/update/delete returns `404`

**Likely cause:** The integer ID does not exist, or the record was already deleted.

**Diagnose:** List current records with `GET /api/v1/iocs` and confirm the ID.

**Fix:** Use an existing ID. There is no soft-delete recovery endpoint.

### Symptom: An IOC is stored but not analyzed

**Cause:** IOC CRUD does not automatically call provider lookup, correlation, or scoring.

**Fix/workaround:** Run `POST /api/v1/threat-analysis/{ip}/analyze` separately for an IP. The current frontend blocks analysis for non-IP selections.

## 14. Frontend-Backend API Communication Problems

### Symptom: Frontend reports a load error or fetch failure

**Likely causes:** Backend is stopped, wrong URL, route prefix mismatch, CORS failure, or missing bearer header.

**Diagnose:**

```bash
curl -i http://127.0.0.1:8000/
curl -i http://127.0.0.1:8000/api/v1/health
```

Inspect the browser Network panel for request URL, status, response body, and request headers.

**Fix:** Keep the backend at `http://127.0.0.1:8000` for current local behavior, use `/api/v1`, and authenticate protected requests. Current feature pages do not consistently attach the stored token.

### Symptom: Frontend uses the wrong backend after setting `NEXT_PUBLIC_API_URL`

**Likely cause:** Some pages read the variable, while IOC and Threat Feed pages use hard-coded `http://127.0.0.1:8000`.

**Fix/workaround:** Use the default local backend address, or update affected application code as a separate change. Restart Next.js after changing environment files.

## 15. CORS Problems

### Symptom: Browser shows a CORS error

**Likely cause:** The browser origin is not in the backend allowlist.

**Diagnose:** Current allowed origins in `backend/app/main.py` are:

- `http://localhost:3000`
- `http://127.0.0.1:3000`

**Fix:** Use one exact local origin, or intentionally change backend CORS configuration. The current configuration allows credentials, all methods, and all headers. Also inspect backend logs and reproduce with `curl`, because CORS can mask a `401` or `500`.

## 16. Environment Variable and Configuration Problems

### Symptom: Settings validation error at import

**Likely cause:** A required setting in `backend/app/core/config.py` is missing. Required names are `APP_NAME`, `APP_VERSION`, `APP_DESCRIPTION`, `API_PREFIX`, `DATABASE_URL`, `ABUSEIPDB_API_KEY`, `VIRUSTOTAL_API_KEY`, and `JWT_SECRET_KEY`.

**Diagnose without exposing values:**

```bash
cd backend
awk -F= '{print $1}' .env | sed '/^[[:space:]]*$/d' | sort
```

**Fix:** Add missing local values to `backend/.env`. Never print the right-hand side or commit the file.

### Symptom: Configuration appears ignored

**Likely cause:** Command was run from the wrong directory. `env_file=".env"` resolves relative to the current working directory.

**Fix:** Run Uvicorn and Alembic from `backend/`, or provide variables through the process environment.

### Symptom: Frontend environment change has no effect

**Likely causes:** Next.js server was not restarted, the variable lacks the `NEXT_PUBLIC_` prefix, or the page hard-codes its URL.

**Fix:** Use `frontend/.env.local`, restart Next.js, and verify whether the target page reads `NEXT_PUBLIC_API_URL`.

## 17. Port Conflicts

### Symptom: Address already in use on port 8000 or 3000

**Diagnose on macOS/Linux:**

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

**Fix:** Stop the old local process through its owning terminal. Uvicorn and Next.js support their standard `--port` option, but frontend API URL and backend CORS must match any changed address. Defaults are 8000 and 3000.

## 18. Docker-Related Problems

### Symptom: `docker compose up` does nothing or fails

**Cause:** The root `docker-compose.yml` is empty. `docker/` is also empty; no Dockerfiles, services, images, volumes, networks, or health checks exist.

**Fix/workaround:** Use the local Python, Node.js, and separately managed database workflow. Docker deployment would be new infrastructure.

## 19. Git-Related Problems

### Symptom: Git shows unexpected files or changes

**Likely causes:** The root repository contains an untracked `docs/` directory, or commands were run against nested `backend/.git` instead of the root repository.

**Diagnose:**

```bash
git status --short --branch
git -C backend status --short --branch
```

**Fix:** Use root commands for normal work, inspect ownership, and do not reset or restore changes blindly.

### Symptom: Secret or generated file appears in a staged diff

**Diagnose:**

```bash
git diff --cached --name-only
git check-ignore -v backend/.env backend/.venv frontend/node_modules frontend/.next frontend/.env.local
```

**Fix:** Unstage it with `git restore --staged path/to/file`; rotate any credential that was committed or exposed. Ignore rules cover common paths, but staged content must still be reviewed.

## 20. How to Inspect Logs and Errors

### Backend logs

Read the terminal running:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

Uvicorn prints startup and request tracebacks. SQLAlchemy logging is enabled by `echo=True`. Do not share logs containing credentials, tokens, or sensitive query values.

### Frontend logs

Read the terminal running `npm run dev`, and inspect the browser console and Network panel. Current pages log API errors with `console.error`; the UI may display a shorter message than the raw response.

### API response bodies

Use safe placeholders and inspect status plus JSON detail:

```bash
curl -i http://127.0.0.1:8000/api/v1/health
```

FastAPI documentation at `http://127.0.0.1:8000/docs` is useful for checking route registration and manually sending requests.

## 21. Useful Diagnostic Commands

### Process/configuration

```bash
curl -i http://127.0.0.1:8000/
curl -i http://127.0.0.1:8000/api/v1/health
python --version
node --version
npm --version
```

### Backend and migrations

```bash
cd backend
source .venv/bin/activate
python -c "import app.main; print('backend import OK')"
alembic current
alembic heads
```

### Frontend checks

```bash
cd frontend
npm run lint
npm run build
```

### Git and ignore checks

```bash
git status --short --branch
git diff --check
git diff --name-only
git check-ignore -v backend/.env frontend/node_modules frontend/.next
```

## 22. Common HTTP/API Errors

| Status | Likely cause in this repository | First diagnostic step |
| --- | --- | --- |
| `400` | Invalid IP on feed analysis, or invalid typed IOC value. | Check IP/type and response `detail`. |
| `401` | Missing/invalid/expired bearer token, invalid credentials, or missing user. | Test login and `/api/v1/auth/me`. |
| `403` | Database user is inactive. | Check `is_active`. |
| `404` | IOC ID does not exist. | List IOCs and confirm the ID. |
| `409` | Duplicate username/email or IOC value. | Search existing data. |
| `422` | Invalid/missing Pydantic body or path/query type. | Inspect the `detail` list. |
| `502` | Unexpected VirusTotal response shape. | Inspect provider response handling. |
| `503` | Provider connection failure, or both providers unavailable during correlation. | Check keys, network, and provider status. |
| `504` | Provider exceeded the ten-second timeout. | Check provider latency/network. |
| CORS browser error | Origin not in localhost allowlist or backend unreachable. | Compare browser origin and CORS config. |

## 23. Developer Troubleshooting Checklist

- [ ] Run Python/Alembic commands from `backend/` and npm commands from `frontend/`.
- [ ] Confirm Python 3.10+ and a Node.js version compatible with Next.js 16.
- [ ] Confirm the virtual environment is active and dependencies are installed.
- [ ] Confirm required backend settings exist without exposing their values.
- [ ] Confirm the database is reachable and migrations are applied.
- [ ] Confirm `/` and `/api/v1/health` respond.
- [ ] Confirm frontend dependencies install and lint/build pass for frontend changes.
- [ ] Confirm browser origin matches current CORS behavior.
- [ ] Confirm protected requests include `Authorization: Bearer <token>`.
- [ ] Confirm provider keys, network access, and rate limits for feed/correlation work.
- [ ] Confirm input is valid for the route and IOC type.
- [ ] Confirm Git commands target the root repository, not nested `backend/.git`.
- [ ] Review logs and response bodies without sharing sensitive values.

## 24. Current Known Limitations and Missing Infrastructure

- No backend or frontend automated test suite is configured.
- No backend formatter, backend linter, or frontend formatter is configured.
- No CI/CD workflows exist; `.github/workflows/.gitkeep` is the only workflow file.
- No helper scripts exist under `scripts/`.
- No Dockerfile or usable Docker Compose configuration exists.
- No database provisioning, readiness, backup, or restore tooling exists.
- `/api/v1/health` is static and does not test database/provider availability.
- Backend SQL logging is enabled with `echo=True`.
- Frontend API URL handling is inconsistent, with hard-coded local URLs in IOC and Threat Feed pages.
- Frontend feature requests do not consistently attach the stored bearer token, despite backend protection.
- No role-based authorization or per-user IOC ownership exists.
- No background provider ingestion, alert delivery, key rotation, or quota monitoring exists.
- Threat scoring is deterministic rule-based logic; no ML/LLM inference exists.

These limitations are current repository facts. Workarounds in this guide do not imply that the missing infrastructure is implemented.
