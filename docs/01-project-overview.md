# ThreatLens AI: Project Overview

This document introduces ThreatLens AI to developers joining the project. It describes the behavior that is currently present in the repository, rather than planned or implied functionality.

## What ThreatLens AI Is

ThreatLens AI is a web application for investigating IP addresses and managing indicators of compromise (IOCs). It provides an authenticated security console where a user can:

- Look up an IP address in AbuseIPDB and VirusTotal.
- Correlate the available provider results into one rule-based threat assessment.
- Save and review historical IP analyses.
- Create, view, filter, update, and delete IOC records.
- Monitor IOC and analysis counts from a dashboard.

The product name includes “AI”, but the current implementation does not call a machine-learning model or an LLM. The correlation service uses explicit scoring rules and generated text summaries.

## Problem It Solves

IP reputation data is spread across external threat-intelligence providers, while analyst-maintained indicators need a place to be recorded and reviewed. ThreatLens AI brings those activities into one workflow. It presents provider signals together, applies a consistent score and severity level, and retains the resulting assessment for later investigation.

The current implementation is focused on IP-based investigation. IOC records can represent values such as IP addresses and domains, but the external feed and correlation workflows accept IP addresses.

## Why the Project Exists

The project exists to provide a single, developer-extensible foundation for threat-intelligence lookup, IOC management, and repeatable IP risk assessment. Its current boundaries make it suitable for learning, prototyping, and extending a security operations workflow around a FastAPI API and a Next.js console.

## Main Objectives

The implemented objectives are:

1. Provide a versioned backend API for authentication, IOC management, threat-feed lookup, and threat-analysis history.
2. Protect application operations with registered users, bcrypt password hashing, and JWT bearer tokens.
3. Validate IP and domain IOC values before storing them.
4. Normalize AbuseIPDB and VirusTotal results into a common threat score, severity, risk-factor list, and summary.
5. Persist IOCs and completed analyses in a relational database.
6. Expose those operations through a browser-based security operations console.

## Implemented Features

### Authentication

- User registration with a unique username and email.
- Login by username and password.
- JWT access-token creation with user ID, username, role, and expiration claims.
- Current-user lookup through `/api/v1/auth/me`.
- Inactive accounts are rejected.
- The frontend has login, registration, and session-checking guard flows.

New registrations receive the `analyst` role. Although the role is included in the token and user model, there is no role-based authorization behavior in the current API.

### IOC Intelligence

The IOC API stores a unique value with its type, source, threat level, and creation timestamp. It supports:

- Create, read, update, and delete operations.
- IP validation for `IP` records.
- Domain validation for `DOMAIN` records.
- Filtering by type, source, and threat level.
- Searching by IOC value.
- Pagination with `limit` and `offset`.
- Sorting by approved fields such as value, type, threat level, and creation time.

The frontend provides an IOC list, filters, search, add and edit forms, detail viewing, deletion, and an option to analyze an IOC.

### Threat-Intelligence Lookup

For an IP address, the backend can call:

- **AbuseIPDB**, requesting a check with a maximum report age of 90 days. The raw provider response is returned by the direct feed endpoint.
- **VirusTotal**, using its v3 IP-address endpoint. The service extracts country, ASN, network, reputation, and analysis counts for malicious, suspicious, harmless, and undetected results.

The application handles provider timeouts, connection failures, HTTP errors, and unexpected VirusTotal response shapes with API errors.

### Threat Correlation

The correlation service queries both providers independently. If at least one provider responds, it produces and stores a unified analysis. If both are unavailable, it returns a service-unavailable error.

The current rules are:

- AbuseIPDB score: 85% confidence score plus 15% normalized report count.
- VirusTotal score: 10 points per malicious engine and 5 points per suspicious engine, capped at 100.
- When both sources are available, the final score is 60% AbuseIPDB and 40% VirusTotal. If only one source is available, that source's score is used.
- Scores are constrained to 0-100 and mapped to levels: `LOW` below 30, `MEDIUM` from 30, `HIGH` from 60, and `CRITICAL` from 80.
- Risk factors record provider findings and provider availability errors.
- A fixed summary is generated from the resulting severity level.

Analyses are stored with the IP, score, level, provider counts, risk factors, summary, and timestamp. The API supports listing recent analyses and retrieving analysis history for one IP.

### Dashboard and Console

The frontend includes these routes:

- `/`: dashboard with IOC totals, high-risk IOC count, analysis totals, average score, severity distribution, and recent intelligence data.
- `/iocs`: IOC management.
- `/threat-feed`: direct AbuseIPDB and VirusTotal lookup plus an analysis action.
- `/threat-analysis`: searchable saved-analysis history and selected analysis details.
- `/correlation`: run a fresh IP correlation and display its score, provider results, factors, and summary.
- `/settings`: client-side controls for API URL, timeout, analysis/correlation toggles, and alert toggles.

The settings page currently changes local component state and displays save/reset feedback. It does not persist settings or change backend behavior.

## Target Users

The primary user is a security analyst or SOC team member investigating suspicious IP addresses and maintaining an IOC list. Developers are a secondary audience: the project is organized as a small full-stack application that can be extended with additional providers, indicator types, analysis rules, or operational workflows.

## High-Level Workflow

1. A user registers or signs in from the frontend.
2. The frontend stores the returned access token and the session guard validates it through `/auth/me` for protected pages.
3. The user enters an IP address in Threat Feed or Correlation.
4. The backend calls the configured external providers and normalizes the responses.
5. The correlation service calculates a score, assigns a threat level, creates risk factors, and generates a summary.
6. The completed correlation is saved to the `threat_analyses` table.
7. The user reviews the result immediately or later through Threat Analysis history.
8. Separately, the user can maintain manually sourced or otherwise attributed IOCs in the `iocs` table and inspect aggregate data on the dashboard.

## Technology Stack

### Backend

- Python with FastAPI and Uvicorn.
- Pydantic 2 and `pydantic-settings` for request/response schemas and environment configuration.
- SQLAlchemy 2 for database access and ORM models.
- Alembic for schema migrations.
- PostgreSQL-compatible database connectivity through Psycopg; the actual database is selected by `DATABASE_URL`.
- `httpx` for asynchronous calls to AbuseIPDB and VirusTotal.
- `python-jose` for JWT handling.
- `passlib` with bcrypt for password hashing and verification.

### Frontend

- Next.js 16 with the App Router.
- React 19 and TypeScript.
- Tailwind CSS 4 through the PostCSS integration.
- `lucide-react` for icons.
- `recharts` is included for dashboard visualization support.

The backend API is mounted under `/api/v1`. By default, the frontend points at `http://127.0.0.1:8000`; the dashboard and shared auth code can use `NEXT_PUBLIC_API_URL` to override that base URL.

## Data Model

- **User**: username, email, bcrypt password hash, role, active flag, and creation time.
- **IOC**: unique indicator value, type, source, threat level, and creation time.
- **ThreatAnalysis**: analyzed IP, correlated score and level, AbuseIPDB counts, VirusTotal counts, risk factors, summary, and creation time.

The three tables are represented by SQLAlchemy models and have Alembic migrations in `backend/alembic/versions/`.

## Current Project Status

The repository contains a working prototype with the main application paths implemented: authentication, protected API routes, database models and migrations, external-provider adapters, rule-based correlation, analysis history, IOC CRUD, and the corresponding frontend pages.

It is not yet a production-complete platform. In particular:

- There are no backend test files under `backend/app/tests` in the current repository.
- Provider access requires valid `ABUSEIPDB_API_KEY` and `VIRUSTOTAL_API_KEY` settings.
- The API also requires application and database settings, including `DATABASE_URL` and JWT configuration.
- Most protected data requests made by the frontend pages do not currently attach the stored bearer token, even though the backend requires authentication for IOC, feed, and analysis routes. This is an integration gap to account for when running or extending the console.
- The settings screen is not connected to a persistence or configuration endpoint.
- The codebase contains no implemented ML/LLM analysis, alert delivery system, background ingestion pipeline, or general non-IP correlation workflow.
- Deployment and container orchestration are not represented by a populated `docker-compose.yml` in the current repository.

Treat these as current implementation boundaries when adding documentation or planning work.

## Important Terminology

- **IOC (Indicator of Compromise)**: A value associated with potentially malicious activity. In the current data model it is stored with a type, source, and threat level.
- **IP address**: The only indicator type accepted by the external lookup and correlation workflows. The IOC validator also supports domain values for stored IOC records.
- **Threat feed**: An external intelligence provider queried for information about an indicator. Current providers are AbuseIPDB and VirusTotal.
- **AbuseIPDB confidence score**: The provider's 0-100 confidence signal that an IP is abusive.
- **VirusTotal analysis counts**: Counts of engines classifying an IP as malicious, suspicious, harmless, or undetected.
- **Threat score**: ThreatLens AI's normalized 0-100 result produced from the provider signals.
- **Threat level**: The label derived from the threat score: `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
- **Risk factor**: A plain-text reason included in an analysis, such as provider detections, report counts, or unavailable data.
- **Correlation**: Combining independent provider signals into one score and explanation using the rules in `ThreatCorrelationService`.
- **Analysis history**: Previously saved `ThreatAnalysis` records, ordered newest first.
- **JWT bearer token**: The signed access token sent in an `Authorization: Bearer ...` header to protected backend routes.
- **SOC (Security Operations Center)**: The operational context used by the frontend for investigating and reviewing security indicators.
