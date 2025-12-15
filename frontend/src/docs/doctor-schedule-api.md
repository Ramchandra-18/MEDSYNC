# Doctor Schedule Management API

This document describes the `/api/doctor/schedule` API used by the frontend to view and manage doctor availability (30-minute slots).

---

## Authentication

- Required header:
  `Authorization: Bearer <JWT token>`
- JWT must include claims:
  - `user_code` (doctor identifier) — required
  - `role` — must be `doctor` (case-insensitive)
  - `full_name` / `name` — optional (used for display)

Errors:
- `401 Unauthorized` — token missing/expired/invalid or missing `user_code`
- `403 Forbidden` — role not `doctor`

---

## GET /api/doctor/schedule

Description: Retrieve the doctor's availability schedule. The server returns slot datetimes in UTC.

Headers:
- `Authorization: Bearer <token>`

Response 200:

```json
{
  "doctor_code": "D6148",
  "doctor_name": "Anjali",
  "schedule": [
    { "slot_datetime": "2025-11-12T09:30:00+00:00", "is_available": true },
    { "slot_datetime": "2025-11-12T10:00:00+00:00", "is_available": false }
  ]
}
```

Notes for frontend:
- `slot_datetime` is UTC; convert to local timezone for display.
- `is_available: true` means the slot is free; `false` means blocked/unavailable.

Errors:
- `401` Missing/malformed Authorization or missing `user_code` in token
- `403` Role missing or not `doctor`
- `500` Server/database error

---

## POST /api/doctor/schedule

Description: Update availability using one of several actions. All requests require the same `Authorization` header.

Headers:
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

General body shape:

```json
{
  "action": "<action_name>",
  // plus action-specific fields
}
```

Supported actions:

1) `block_slot`

- Body:
```json
{ "action": "block_slot", "slot": "2025-11-12 09:30:00" }
```

2) `unblock_slot`

- Body:
```json
{ "action": "unblock_slot", "slot": "2025-11-12 09:30:00" }
```

3) `block_day`

- Body:
```json
{ "action": "block_day", "day": "2025-11-12" }
```

- Blocks slots from 09:00–16:30 in 30-minute increments for the day.

4) `unblock_day`

- Body:
```json
{ "action": "unblock_day", "day": "2025-11-12" }
```

5) `unblock_all`

- Body:
```json
{ "action": "unblock_all" }
```

6) `block_all` (not implemented)

- Body:
```json
{ "action": "block_all" }
```

Responses:
- `200 OK` — operation succeeded with a message and doctor metadata.
- `400 Bad Request` — missing or invalid fields
- `401 Unauthorized` — token problems
- `403 Forbidden` — insufficient role
- `500 Server Error` — DB or internal error
- `501 Not Implemented` — `block_all` placeholder

Example success response:

```json
{ "message": "Schedule updated successfully for action: block_slot", "doctor_code": "D6148", "doctor_name": "Anjali" }
```

---

## Data model expectation (server-side)

`doctor_availability` table (example):
- `doctor_id`: text (stores `user_code` from JWT)
- `slot_datetime`: timestamptz (UTC)
- `is_available`: boolean
- Unique constraint on (`doctor_id`, `slot_datetime`) for idempotent updates

---

## Frontend integration tips

- Centralize Authorization header through a helper or fetch wrapper (the frontend already uses `fetchWithControl`).
- Convert UTC `slot_datetime` to local time for display; convert local slot selections back to UTC for POST.
- Validate JWT client-side for `role` (case-insensitive) and presence of `user_code` to provide faster feedback; server is the source of truth.
- Handle status codes:
  - `401`: clear token and redirect to login
  - `403`: show access denied
  - `5xx`: show friendly server error
- For day-level operations, use 30-minute increments between 09:00 and 16:30 (inclusive start, exclusive end at 17:00) as the contract.

---

## Example React snippets

GET:

```js
fetch('/api/doctor/schedule', { headers: { Authorization: `Bearer ${token}` } })
  .then(r => r.json())
  .then(data => /* process schedule */);
```

POST (block slot):

```js
fetch('/api/doctor/schedule', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'block_slot', slot: '2025-11-12 09:30:00' })
}).then(r => r.json()).then(data => /* handle */);
```

---

Place this file alongside frontend docs so other developers can copy/paste examples and understand the API contract.
