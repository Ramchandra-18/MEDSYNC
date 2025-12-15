# Pharmacy Prescriptions API

This document describes the GET /api/pharmacy/prescriptions endpoint and how to call it from the React frontend.

## Endpoint

GET /api/pharmacy/prescriptions

## Query parameters (all optional)

- page (int) — page number (default 1)
- limit (int) — items per page (default 20, max 100)
- patient_email (string)
- patient_name (string)
- doctor_name (string)
- doctor_code (string)
- department (string)
- disease (string)
- date (YYYY-MM-DD)
- date_from (YYYY-MM-DD)
- date_to (YYYY-MM-DD)
- sort_by (created_at, prescription_date, patient_name, doctor_name, patient_age, disease, doctor_department)
- sort_order (asc|desc)

Example:

GET /api/pharmacy/prescriptions?page=2&limit=10&patient_email=john@example.com&doctor_department=Cardiology&date_from=2025-01-01&date_to=2025-05-01&sort_by=doctor_name

## Headers

- Optional: `Authorization: Bearer <jwtToken>` if your backend requires authentication.

## Response (200)

```json
{
  "message": "Prescriptions retrieved successfully. Emails sent to patients.",
  "prescriptions": [ /* array of prescription objects */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_count": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  },
  "filters_applied": { /* echo of applied filters */ }
}
```

Notes

- The API will attempt to send emails for each returned prescription as a side effect; the response still returns promptly with the prescriptions list.
- Use `pagination` fields to drive UI paging controls.
- If your backend requires authentication, include the Bearer token (we added token support to `PrescriptionPage.jsx`).

## React integration snippet

```js
const params = new URLSearchParams({ patient_email: 'john@example.com', limit: 1 }).toString();
const token = localStorage.getItem('jwtToken');
const res = await fetch(`/api/pharmacy/prescriptions?${params}`, {
  method: 'GET',
  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
});
if (!res.ok) throw new Error('Failed to fetch prescriptions');
const data = await res.json();
```

Place this file in `src/docs` so other developers and QA can reference the API contract and example calls.
