# ThreatLens AI - API Documentation

This is the API reference for the FastAPI backend currently implemented in ThreatLens AI. All paths below are relative to the backend host and use the `/api/v1` prefix unless stated otherwise.

## 1. API Overview

### Framework and base path

- **Framework:** FastAPI, created in `backend/app/main.py`.
- **Base path:** `/api/v1`, configured in `backend/app/api/router.py`.
- **Local backend URL:** `http://127.0.0.1:8000` when started with the repository's default Uvicorn command.
- **API format:** JSON request bodies and JSON responses for the application endpoints.
- **Interactive documentation:** FastAPI also exposes `/docs` and `/redoc` from the application host.

The root status endpoint is outside the versioned router at `GET /`. The versioned routers are registered by `backend/app/api/router.py` in this order: health, message, IOC, threat feed, threat analysis, and authentication.

### Authentication

Protected routes use an HTTP bearer token:

```http
Authorization: Bearer <access_token>
```

Tokens are JWTs created by `backend/app/core/security.py`. The backend validates the token, reads the user ID from the `sub` claim, loads the user from the database, and checks that the account is active. The shared dependency is `get_current_user` in `backend/app/api/dependencies.py`.

### Request and response conventions

- JSON request bodies are validated by Pydantic schemas in `backend/app/schemas/`.
- Path and query parameters are declared directly on endpoint functions.
- Successful responses may be Pydantic-serialized models, lists of models, raw provider JSON, or small dictionaries depending on the route.
- Dates are returned as ISO-formatted datetime strings by Pydantic/ FastAPI serialization.
- There is no common envelope such as `{ "data": ... }` around application responses.
- Error responses use FastAPI's standard error shape, normally `{ "detail": "..." }`. Request validation errors use FastAPI's structured `detail` list.

## 2. Authentication APIs

Source files: `backend/app/api/endpoints/auth.py`, `backend/app/services/auth_service.py`, `backend/app/schemas/auth.py`, and `backend/app/core/security.py`.

### Register

**`POST /api/v1/auth/register`**

Creates a user account. This route is public and does not require a bearer token. New users are assigned the `analyst` role and are active by default.

Request body, defined by `UserRegister`:

| Field | Type | Rules |
| --- | --- | --- |
| `username` | string | 3-50 characters; unique. |
| `email` | string | Valid email address; unique. |
| `password` | string | 8-128 characters. |

Example request:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/register \
	-H 'Content-Type: application/json' \
	-d '{"username":"analyst1","email":"analyst1@example.com","password":"<local_password>"}'
```

Successful response: **`201 Created`**, serialized as `UserResponse`:

```json
{
	"id": 1,
	"username": "analyst1",
	"email": "analyst1@example.com",
	"role": "analyst",
	"is_active": true,
	"created_at": "2026-08-21T10:00:00"
}
```

Possible errors:

- `409 Conflict`: `Username already exists.`, `Email already exists.`, or the combined duplicate message from a database race.
- `422 Unprocessable Entity`: invalid email or username/password length.
- Database errors can surface as server errors if the configured database is unavailable.

Handler: `register` in `backend/app/api/endpoints/auth.py`.

### Login

**`POST /api/v1/auth/login`**

Authenticates by username and password and returns a JWT access token. This route is public.

Request body, defined by `UserLogin`:

```json
{
	"username": "analyst1",
	"password": "<local_password>"
}
```

Both fields have the same length constraints as registration. Example:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
	-H 'Content-Type: application/json' \
	-d '{"username":"analyst1","password":"<local_password>"}'
```

Successful response: **`200 OK`**, serialized as `TokenResponse`:

```json
{
	"access_token": "<jwt_access_token>",
	"token_type": "bearer",
	"user": {
		"id": 1,
		"username": "analyst1",
		"email": "analyst1@example.com",
		"role": "analyst",
		"is_active": true,
		"created_at": "2026-08-21T10:00:00"
	}
}
```

Possible errors:

- `401 Unauthorized`: user does not exist or the password is incorrect; the detail is `Invalid username or password.`
- `403 Forbidden`: the account is inactive.
- `422 Unprocessable Entity`: missing fields or values outside the schema length constraints.

Handler: `login` in `backend/app/api/endpoints/auth.py`; credential logic is in `AuthService.login`.

### Current user

**`GET /api/v1/auth/me`**

Returns the user associated with the supplied JWT. Requires a valid bearer token.

Example:

```bash
curl http://127.0.0.1:8000/api/v1/auth/me \
	-H 'Authorization: Bearer <jwt_access_token>'
```

Successful response: **`200 OK`**, with the same `UserResponse` shape shown for registration.

Possible errors:

- `401 Unauthorized`: missing credentials, invalid/expired token, missing/invalid `sub` claim, or no matching user.
- `403 Forbidden`: the user exists but `is_active` is false.

Handler: `get_current_user` in `backend/app/api/endpoints/auth.py`. The separate shared dependency in `backend/app/api/dependencies.py` implements the same validation behavior for protected feature routes.

## 3. IOC APIs

Source files: `backend/app/api/endpoints/ioc.py`, `backend/app/services/ioc_service.py`, `backend/app/repositories/ioc_repository.py`, `backend/app/schemas/ioc.py`, and `backend/app/validators/ioc_validator.py`.

All IOC routes require a valid bearer token. IOC records have the following response shape, defined by `IOCResponse`:

```json
{
	"id": 7,
	"value": "203.0.113.10",
	"type": "IP",
	"source": "Manual",
	"threat_level": "HIGH",
	"created_at": "2026-08-21T10:15:00"
}
```

### Create an IOC

**`POST /api/v1/iocs`**

Creates a unique IOC. Request body is `IOCCreate`:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `value` | string | Yes | Stored as the unique IOC value. |
| `type` | string | Yes | `IP` values are IP-validated; `DOMAIN` values are domain-validated. Other types are not rejected by the service. |
| `source` | string | Yes | Attribution/source text. |
| `threat_level` | string | Yes | Stored as supplied; the service does not enforce a fixed set of labels. |

Example:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/iocs \
	-H 'Authorization: Bearer <jwt_access_token>' \
	-H 'Content-Type: application/json' \
	-d '{"value":"203.0.113.10","type":"IP","source":"Manual","threat_level":"HIGH"}'
```

Successful response: **`200 OK`** with an `IOCResponse` object.

Possible errors:

- `400 Bad Request`: invalid IP or domain for the declared type.
- `401 Unauthorized` / `403 Forbidden`: authentication or account failure.
- `409 Conflict`: the IOC value already exists.
- `422 Unprocessable Entity`: missing body fields.

Handler: `create_ioc` in `backend/app/api/endpoints/ioc.py`.

### List IOCs

**`GET /api/v1/iocs`**

Returns a list of IOC records. Requires a bearer token. The endpoint returns a JSON array of `IOCResponse` objects.

Query parameters:

| Parameter | Type | Default | Behavior |
| --- | --- | --- | --- |
| `type` | string or null | omitted | Exact type filter. |
| `source` | string or null | omitted | Exact source filter. |
| `threat_level` | string or null | omitted | Exact threat-level filter. |
| `search` | string or null | omitted | Searches within `value`. |
| `limit` | integer | `10` | Maximum records returned. |
| `offset` | integer | `0` | Number of records skipped. |
| `sort_by` | string | `created_at` | Allowed values: `id`, `value`, `type`, `source`, `threat_level`, `created_at`; unknown values fall back to `created_at`. |
| `sort_order` | string | `desc` | `desc` sorts descending; any other value sorts ascending. |

Example:

```bash
curl 'http://127.0.0.1:8000/api/v1/iocs?type=IP&threat_level=HIGH&limit=10&offset=0&sort_by=created_at&sort_order=desc' \
	-H 'Authorization: Bearer <jwt_access_token>'
```

Successful response:

```json
[
	{
		"id": 7,
		"value": "203.0.113.10",
		"type": "IP",
		"source": "Manual",
		"threat_level": "HIGH",
		"created_at": "2026-08-21T10:15:00"
	}
]
```

Possible errors: `401`/`403` for authentication, `422` for malformed query parameter types, and database/server errors if persistence is unavailable.

Handler: `get_all_iocs` in `backend/app/api/endpoints/ioc.py`; query behavior is in `IOCRepository.get_all`.

### Get one IOC

**`GET /api/v1/iocs/{ioc_id}`**

Returns one IOC by integer ID. Requires a bearer token.

Example:

```bash
curl http://127.0.0.1:8000/api/v1/iocs/7 \
	-H 'Authorization: Bearer <jwt_access_token>'
```

Successful response: **`200 OK`** with an `IOCResponse` object.

Possible errors: `404 Not Found` with `{ "detail": "IOC not found" }`, `401`/`403` for authentication, or `422` for a non-integer ID.

Handler: `get_ioc_by_id` in `backend/app/api/endpoints/ioc.py`.

### Update an IOC

**`PUT /api/v1/iocs/{ioc_id}`**

Replaces the IOC value, type, source, and threat level. The request body is `IOCCreate` (the separate `IOCUpdate` schema exists but is not used by this endpoint). Requires a bearer token.

Example:

```bash
curl -X PUT http://127.0.0.1:8000/api/v1/iocs/7 \
	-H 'Authorization: Bearer <jwt_access_token>' \
	-H 'Content-Type: application/json' \
	-d '{"value":"203.0.113.11","type":"IP","source":"Manual review","threat_level":"MEDIUM"}'
```

Successful response: **`200 OK`** with an `IOCResponse` object.

Possible errors:

- `400 Bad Request`: invalid IP or domain for the declared type.
- `404 Not Found`: IOC ID does not exist.
- `409 Conflict`: another IOC already uses the replacement value.
- `401`/`403`: authentication failure.
- `422`: invalid path or missing body fields.

Handler: `update_ioc` in `backend/app/api/endpoints/ioc.py`.

### Delete an IOC

**`DELETE /api/v1/iocs/{ioc_id}`**

Deletes an IOC by integer ID. Requires a bearer token.

Example:

```bash
curl -X DELETE http://127.0.0.1:8000/api/v1/iocs/7 \
	-H 'Authorization: Bearer <jwt_access_token>'
```

Successful response: **`200 OK`**:

```json
{
	"message": "IOC deleted successfully"
}
```

Possible errors: `404 Not Found` with `{ "detail": "IOC not found" }`, `401`/`403` for authentication, or `422` for a non-integer ID.

Handler: `delete_ioc` in `backend/app/api/endpoints/ioc.py`.

## 4. Threat Feed APIs

Source files: `backend/app/api/endpoints/threat_feed.py`, `backend/app/services/threat_feed_service.py`, `backend/app/services/virus_total_service.py`, and `backend/app/services/threat_correlation_service.py`.

All three routes require a bearer token. Direct feed routes do not call the repository and do not save a result. Provider calls have a 10-second HTTPX timeout.

### AbuseIPDB lookup

**`GET /api/v1/threat-feed/check/{ip}`**

Calls AbuseIPDB's IP check endpoint and returns the raw JSON response from the provider. The backend sends the path value as `ipAddress` and requests a maximum report age of 90 days.

Example:

```bash
curl http://127.0.0.1:8000/api/v1/threat-feed/check/203.0.113.10 \
	-H 'Authorization: Bearer <jwt_access_token>'
```

The response shape is provider-defined. A representative shape based on fields consumed by the correlation service is:

```json
{
	"data": {
		"ipAddress": "203.0.113.10",
		"abuseConfidenceScore": 75,
		"totalReports": 12
	}
}
```

The provider may return additional fields. Possible errors include:

- `401`/`403`: application authentication failure.
- Provider HTTP status: forwarded as the response status with `AbuseIPDB API request failed.`.
- `504 Gateway Timeout`: `AbuseIPDB request timed out.`.
- `503 Service Unavailable`: unable to connect to AbuseIPDB.

Handler: `check_ip` in `backend/app/api/endpoints/threat_feed.py`; provider adapter: `ThreatFeedService.check_ip`.

### VirusTotal lookup

**`GET /api/v1/threat-feed/virustotal/{ip}`**

Calls VirusTotal's v3 IP-address endpoint and returns the normalized application object:

```json
{
	"ip": "203.0.113.10",
	"country": "US",
	"asn": 64500,
	"network": "203.0.113.0/24",
	"reputation": -10,
	"malicious": 2,
	"suspicious": 1,
	"harmless": 80,
	"undetected": 5
}
```

Values such as country, ASN, network, and reputation come from VirusTotal and may be null or vary by provider response. Example:

```bash
curl http://127.0.0.1:8000/api/v1/threat-feed/virustotal/203.0.113.10 \
	-H 'Authorization: Bearer <jwt_access_token>'
```

Possible errors include application `401`/`403`, provider HTTP status with `VirusTotal API request failed.`, `504` for timeout, `503` for connection failure, and `502 Bad Gateway` with `Unexpected response received from VirusTotal.` for an unexpected response shape.

Handler: `check_virustotal` in `backend/app/api/endpoints/threat_feed.py`; adapter: `VirusTotalService.check_ip` in `backend/app/services/virus_total_service.py`.

### Analyze an IP from the threat-feed router

**`GET /api/v1/threat-feed/analyze/{ip}`**

Validates the path value as IPv4 or IPv6, queries both providers independently, calculates a unified analysis, saves it, and returns `ThreatAnalysisResponse`.

Example:

```bash
curl http://127.0.0.1:8000/api/v1/threat-feed/analyze/203.0.113.10 \
	-H 'Authorization: Bearer <jwt_access_token>'
```

Successful response: **`200 OK`**:

```json
{
	"ip": "203.0.113.10",
	"threat_score": 52.4,
	"threat_level": "MEDIUM",
	"abuseipdb": {
		"confidence_score": 60,
		"total_reports": 12
	},
	"virustotal": {
		"malicious": 2,
		"suspicious": 1,
		"harmless": 80
	},
	"analysis": {
		"risk_factors": [
			"Elevated AbuseIPDB confidence score",
			"VirusTotal detected 2 malicious engines"
		],
		"summary": "This IP shows multiple suspicious indicators and requires further investigation."
	}
}
```

Possible errors:

- `400 Bad Request`: invalid IP address.
- `503 Service Unavailable`: both provider requests failed.
- Provider errors may be captured as risk factors when the other provider succeeds.
- `401`/`403`: authentication failure.

Handler: `analyze_ip` in `backend/app/api/endpoints/threat_feed.py`; correlation: `ThreatCorrelationService.analyze_ip`.

## 5. Threat Analysis APIs

Source files: `backend/app/api/endpoints/threat_analysis.py`, `backend/app/services/threat_correlation_service.py`, and `backend/app/repositories/threat_analysis_repository.py`.

### Run a fresh analysis

**`POST /api/v1/threat-analysis/{ip}/analyze`**

Runs the same correlation service used by the feed analysis route and saves the result. This endpoint requires a bearer token, but the endpoint itself does not perform the explicit IP validation used by `GET /threat-feed/analyze/{ip}`.

Example:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/threat-analysis/203.0.113.10/analyze \
	-H 'Authorization: Bearer <jwt_access_token>'
```

Successful response: **`200 OK`** with the same nested payload shape shown for `GET /api/v1/threat-feed/analyze/{ip}`. This route has no `response_model`, so its declared endpoint contract is less restrictive than the feed route. The service response contains the IP, score, threat level, nested provider values, and nested analysis details; it does not include the database row ID or creation timestamp.

Possible errors: `503` when both providers fail, provider-derived errors in the result when one provider fails, `401`/`403` for authentication, and server/database errors if persistence fails.

Handler: `analyze_ip` in `backend/app/api/endpoints/threat_analysis.py`.

### List saved analyses

**`GET /api/v1/threat-analysis`**

Returns saved `ThreatAnalysis` records, newest first. Requires a bearer token.

Query parameters:

| Parameter | Type | Default |
| --- | --- | --- |
| `limit` | integer | `10` |
| `offset` | integer | `0` |

Example:

```bash
curl 'http://127.0.0.1:8000/api/v1/threat-analysis?limit=10&offset=0' \
	-H 'Authorization: Bearer <jwt_access_token>'
```

Successful response is a JSON array of database-model fields:

```json
[
	{
		"id": 12,
		"ip": "203.0.113.10",
		"threat_score": 52.4,
		"threat_level": "MEDIUM",
		"abuse_confidence_score": 60,
		"abuse_total_reports": 12,
		"vt_malicious": 2,
		"vt_suspicious": 1,
		"vt_harmless": 80,
		"risk_factors": [
			"Elevated AbuseIPDB confidence score"
		],
		"summary": "This IP shows multiple suspicious indicators and requires further investigation.",
		"created_at": "2026-08-21T10:20:00"
	}
]
```

Possible errors: `401`/`403` for authentication, `422` for malformed integer query parameters, and database/server errors.

Handler: `get_all_threat_analyses` in `backend/app/api/endpoints/threat_analysis.py`; query: `ThreatAnalysisRepository.get_all`.

### Get analysis history for an IP

**`GET /api/v1/threat-analysis/{ip}`**

Returns all saved analysis records whose `ip` exactly matches the path value, newest first. Requires a bearer token. The path value is not explicitly validated by this endpoint.

Example:

```bash
curl http://127.0.0.1:8000/api/v1/threat-analysis/203.0.113.10 \
	-H 'Authorization: Bearer <jwt_access_token>'
```

Successful response is an array using the same flat persisted-record shape as the list endpoint. If there are no matches, the endpoint returns an empty array rather than a `404`.

Handler: `get_threat_analysis_by_ip` in `backend/app/api/endpoints/threat_analysis.py`; query: `ThreatAnalysisRepository.get_by_ip`.

## 6. Health APIs

### Backend root status

**`GET /`**

Returns basic application metadata. This route is outside `/api/v1` and is public.

Example response:

```json
{
	"project": "ThreatLens AI",
	"status": "Running",
	"version": "0.1.0"
}
```

Handler: `root` in `backend/app/main.py`.

### Health check

**`GET /api/v1/health`**

Returns a static backend health response. It is public and does not query the database or external providers.

```bash
curl http://127.0.0.1:8000/api/v1/health
```

Response: **`200 OK`**:

```json
{
	"status": "healthy",
	"service": "ThreatLens AI Backend",
	"version": "0.1.0"
}
```

Handler: `health_check` in `backend/app/api/endpoints/health.py`; response schema: `backend/app/schemas/health.py`.

## 7. Message/Other APIs

### Echo a message

**`POST /api/v1/message`**

Accepts a message and returns it with its Python string length. This route is public and is not connected to threat analysis or persistence.

Request body, defined by `MessageRequest`:

```json
{
	"message": "hello ThreatLens"
}
```

Example:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/message \
	-H 'Content-Type: application/json' \
	-d '{"message":"hello ThreatLens"}'
```

Response: **`200 OK`**:

```json
{
	"received_message": "hello ThreatLens",
	"length": 16
}
```

Handler: `create_message` in `backend/app/api/endpoints/message.py`; schemas: `backend/app/schemas/message.py`.

## 8. API Endpoint Summary

| Method | Endpoint | Purpose | Authentication | Source |
| --- | --- | --- | --- | --- |
| `GET` | `/` | Return root application status. | Public | `backend/app/main.py:root` |
| `POST` | `/api/v1/auth/register` | Register a user. | Public | `backend/app/api/endpoints/auth.py:register` |
| `POST` | `/api/v1/auth/login` | Authenticate and issue a JWT. | Public | `backend/app/api/endpoints/auth.py:login` |
| `GET` | `/api/v1/auth/me` | Return the current user. | Bearer token | `backend/app/api/endpoints/auth.py:get_current_user` |
| `GET` | `/api/v1/health` | Return static backend health. | Public | `backend/app/api/endpoints/health.py:health_check` |
| `POST` | `/api/v1/message` | Echo a message and length. | Public | `backend/app/api/endpoints/message.py:create_message` |
| `POST` | `/api/v1/iocs` | Create an IOC. | Bearer token | `backend/app/api/endpoints/ioc.py:create_ioc` |
| `GET` | `/api/v1/iocs` | List/filter/sort/paginate IOCs. | Bearer token | `backend/app/api/endpoints/ioc.py:get_all_iocs` |
| `GET` | `/api/v1/iocs/{ioc_id}` | Get one IOC. | Bearer token | `backend/app/api/endpoints/ioc.py:get_ioc_by_id` |
| `PUT` | `/api/v1/iocs/{ioc_id}` | Replace an IOC. | Bearer token | `backend/app/api/endpoints/ioc.py:update_ioc` |
| `DELETE` | `/api/v1/iocs/{ioc_id}` | Delete an IOC. | Bearer token | `backend/app/api/endpoints/ioc.py:delete_ioc` |
| `GET` | `/api/v1/threat-feed/check/{ip}` | Return raw AbuseIPDB data. | Bearer token | `backend/app/api/endpoints/threat_feed.py:check_ip` |
| `GET` | `/api/v1/threat-feed/virustotal/{ip}` | Return normalized VirusTotal data. | Bearer token | `backend/app/api/endpoints/threat_feed.py:check_virustotal` |
| `GET` | `/api/v1/threat-feed/analyze/{ip}` | Validate, correlate, save, and return an IP analysis. | Bearer token | `backend/app/api/endpoints/threat_feed.py:analyze_ip` |
| `POST` | `/api/v1/threat-analysis/{ip}/analyze` | Run and save a fresh IP analysis. | Bearer token | `backend/app/api/endpoints/threat_analysis.py:analyze_ip` |
| `GET` | `/api/v1/threat-analysis` | List saved analyses. | Bearer token | `backend/app/api/endpoints/threat_analysis.py:get_all_threat_analyses` |
| `GET` | `/api/v1/threat-analysis/{ip}` | Get saved history for an IP. | Bearer token | `backend/app/api/endpoints/threat_analysis.py:get_threat_analysis_by_ip` |

## 9. Common Error Responses

### Authentication and authorization

Protected routes use the following actual error categories:

| Status | Typical detail | Cause |
| --- | --- | --- |
| `401` | `Not authenticated` or `Invalid or expired token.` | Missing bearer credentials, invalid/expired JWT, malformed user ID, or missing user. |
| `403` | `User account is inactive.` | Token is valid but the database user is inactive. |

The exact missing-credential response can be generated by FastAPI's `HTTPBearer`; explicit token validation errors are raised by the auth endpoint or `get_current_user` dependency.

### Validation and resource errors

| Status | Typical detail | Cause |
| --- | --- | --- |
| `400` | `Invalid IP address` or `Invalid IP address.` | Invalid IP in the validated IOC or feed-analysis path. |
| `404` | `IOC not found` | Requested IOC does not exist. |
| `409` | `IOC '<value>' already exists.`, `Username already exists.`, or `Email already exists.` | Uniqueness conflict. |
| `422` | FastAPI validation-error object with a `detail` list | Missing/invalid JSON fields or incompatible path/query types. |

### External provider errors

| Status | Detail | Provider/context |
| --- | --- | --- |
| Provider HTTP status | `AbuseIPDB API request failed.` | AbuseIPDB returned a non-2xx status. |
| Provider HTTP status | `VirusTotal API request failed.` | VirusTotal returned a non-2xx status. |
| `502` | `Unexpected response received from VirusTotal.` | Required VirusTotal response keys were missing or had an unexpected type. |
| `503` | `Unable to connect to AbuseIPDB.` | AbuseIPDB connection failure. |
| `503` | `Unable to connect to VirusTotal.` | VirusTotal connection failure. |
| `503` | `Threat intelligence services are currently unavailable.` | Correlation received no successful result from either provider. |
| `504` | `AbuseIPDB request timed out.` | AbuseIPDB request exceeded the 10-second HTTPX timeout. |
| `504` | `VirusTotal request timed out.` | VirusTotal request exceeded the 10-second HTTPX timeout. |

Provider errors are handled independently by `ThreatCorrelationService`. If one provider succeeds, the analysis can still be returned and the unavailable provider is represented in `risk_factors`.

## 10. Example API Workflow

This workflow uses only implemented endpoints. It assumes the backend is running, migrations have been applied, and the provider settings are configured.

### 1. Register

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/register \
	-H 'Content-Type: application/json' \
	-d '{"username":"analyst1","email":"analyst1@example.com","password":"<local_password>"}'
```

### 2. Login and capture the token

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
	-H 'Content-Type: application/json' \
	-d '{"username":"analyst1","password":"<local_password>"}'
```

Use the returned `access_token` as `<jwt_access_token>` in subsequent requests. Do not place a real token in source control or documentation.

### 3. Verify the session

```bash
curl http://127.0.0.1:8000/api/v1/auth/me \
	-H 'Authorization: Bearer <jwt_access_token>'
```

### 4. Create an IOC

```bash
curl -X POST http://127.0.0.1:8000/api/v1/iocs \
	-H 'Authorization: Bearer <jwt_access_token>' \
	-H 'Content-Type: application/json' \
	-d '{"value":"203.0.113.10","type":"IP","source":"Manual","threat_level":"LOW"}'
```

### 5. Run and save an analysis

```bash
curl -X POST http://127.0.0.1:8000/api/v1/threat-analysis/203.0.113.10/analyze \
	-H 'Authorization: Bearer <jwt_access_token>'
```

The response contains the calculated score, level, provider values, risk factors, and summary. The service also inserts a record into `threat_analyses`.

### 6. Retrieve stored analysis history

```bash
curl http://127.0.0.1:8000/api/v1/threat-analysis/203.0.113.10 \
	-H 'Authorization: Bearer <jwt_access_token>'
```

The response is a list of flat persisted records. The same record is available through `GET /api/v1/threat-analysis` subject to `limit` and `offset`.

## 11. Developer Notes

### Add an endpoint

1. Add a function and route decorator in the appropriate module under `backend/app/api/endpoints/`, or create a focused endpoint module.
2. Add the new router to `backend/app/api/router.py` if it is a new router.
3. Add FastAPI dependencies such as `get_db` and `get_current_user` to the endpoint signature when needed.
4. Keep application behavior in a service or repository consistent with the existing layers.

### Add request or response schemas

Add Pydantic models to the relevant module under `backend/app/schemas/`. Use the schema as the endpoint's `response_model` where a stable response contract is intended. Existing ORM-backed response schemas use `model_config = {"from_attributes": True}`.

### Protect an endpoint

Import `get_current_user` from `backend/app/api/dependencies.py` and add:

```python
current_user=Depends(get_current_user)
```

to the endpoint signature. The current dependency validates the JWT and active database user. It does not enforce role-based permissions; the `role` value is present in the user model and JWT but is not used for authorization rules.

### Connect an endpoint to a service

Follow the current delegation pattern:

- Endpoint module handles HTTP parameters, request schemas, dependencies, and HTTP-specific errors.
- Service module handles validation, orchestration, provider calls, or business rules.
- Repository module handles SQLAlchemy queries, commits, rollbacks, and model persistence.
- Model and schema modules define database and API shapes respectively.

For provider integrations, use the existing `httpx.AsyncClient` pattern and translate timeout, request, HTTP status, and malformed-response failures into `HTTPException` responses as the current provider services do.

### Test an endpoint

No backend test files currently exist under `backend/app/tests/`, and no test command is declared in `backend/requirements.txt` or the repository manifests. For manual verification, run the backend with Uvicorn and use `curl` or FastAPI's `/docs` interface. When adding automated tests, place them under `backend/app/tests/` and add the required test tooling explicitly; that tooling is not currently part of the repository.

## Implementation Boundaries

The following are not current API features:

- No API endpoint performs machine-learning or LLM inference.
- No endpoint exposes persisted settings or notification configuration.
- No endpoint implements scheduled feed ingestion, background workers, or alert delivery.
- No role-specific authorization endpoint or policy is implemented.
- No pagination metadata object is returned; list endpoints return plain arrays.
