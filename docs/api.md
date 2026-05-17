# API Documentation

## Purpose
This document describes the REST APIs for the quiz game backend.
It focuses on the currently implemented `auth` and `admin` modules.

## Base URL
`http://localhost:5000/api`

## Common Rules
All API responses use one consistent envelope:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": "Error message" }
```

Authenticated routes require:

```http
Authorization: Bearer <jwt_token>
```

Admin routes require both:
- valid JWT (`protect` middleware)
- role check (`requireAdmin` middleware)

## Models Used By These APIs
`Question` payload contract used by admin endpoints:

```json
{
  "questionText": "string",
  "options": ["string", "string", "string", "string"],
  "correctAnswer": 0,
  "category": "string",
  "isActive": true
}
```

Validation rules:
- `questionText` required and non-empty
- `options` must contain exactly 4 non-empty strings
- `correctAnswer` must be an integer in `[0, 1, 2, 3]`
- `category` required and non-empty
- `isActive` optional, defaults to `true`

## Auth APIs

### `POST /auth/register`
Create a user account. Admin registration requires `adminSecret`.

Request body:

```json
{
  "username": "alice",
  "password": "123456",
  "role": "admin",
  "adminSecret": "your_admin_register_secret"
}
```

Notes:
- `role` is optional. If missing, defaults to `"user"`.
- to register admin, set `role` to `"admin"` and provide valid `adminSecret`.

Success response:

```json
{
  "success": true,
  "data": {
    "_id": "67f...",
    "username": "alice",
    "role": "admin"
  }
}
```

### `POST /auth/login`
Authenticate a user and return JWT.

Request body:

```json
{
  "username": "alice",
  "password": "123456"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "token": "<jwt_token>",
    "user": {
      "id": "67f...",
      "username": "alice",
      "role": "admin"
    }
  }
}
```

## Admin APIs
All endpoints below require:
- `Authorization: Bearer <jwt_token>`
- authenticated user with `role: "admin"`

### `GET /admin/questions`
Get all questions (supports optional filtering).

Query params:
- `status=active` or `status=inactive`
- `category=<categoryName>`

Example:
`GET /admin/questions?status=active&category=Node.js`

Success response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "67f...",
      "questionText": "Express Router is used for?",
      "options": ["Styling", "Routing", "Database", "Animation"],
      "correctAnswer": 1,
      "category": "Express",
      "isActive": true
    }
  ]
}
```

### `POST /admin/questions`
Create one question.

Request body:

```json
{
  "questionText": "Express Router is used for?",
  "options": ["Styling", "Routing", "Database", "Animation"],
  "correctAnswer": 1,
  "category": "Express",
  "isActive": true
}
```

Success response: `201 Created`

### `PUT /admin/questions/:id`
Update one question by id.

Request body:

```json
{
  "questionText": "Express Router mainly defines?",
  "options": ["Styles", "Routes", "Models", "Tokens"],
  "correctAnswer": 1,
  "category": "Node.js",
  "isActive": true
}
```

Success response: `200 OK`

### `DELETE /admin/questions/:id`
Delete one question by id.

Success response:

```json
{
  "success": true,
  "data": {
    "id": "67f..."
  }
}
```

### `PATCH /admin/questions/:id/toggle`
Toggle question `isActive` status.

Success response:

```json
{
  "success": true,
  "data": {
    "_id": "67f...",
    "isActive": false
  }
}
```

### `POST /admin/questions/bulk-import`
Import multiple questions in one request.

Notes:
- Use `docs/admin-bulk-import-example.json` as a ready-to-import sample file.
- The sample file is valid JSON and does not include inline comments.
- Explanatory notes for each field are documented below instead of being embedded in the JSON.

Accepted request body format A:

```json
{
  "questions": [
    {
      "questionText": "MongoDB is a ____ database.",
      "options": ["Relational", "NoSQL", "Graph", "In-memory"],
      "correctAnswer": 1,
      "category": "MongoDB",
      "isActive": true
    }
  ]
}
```

Accepted request body format B:

```json
[
  {
    "questionText": "MongoDB is a ____ database.",
    "options": ["Relational", "NoSQL", "Graph", "In-memory"],
    "correctAnswer": 1,
    "category": "MongoDB",
    "isActive": true
  }
]
```

Bulk import field notes:
- `questionText`: required, non-empty, and treated as part of the duplicate check.
- `options`: must contain exactly 4 non-empty answer strings.
- `correctAnswer`: zero-based index of the correct option, so valid values are `0`, `1`, `2`, or `3`.
- `category`: required and used together with `questionText` for duplicate detection.
- `isActive`: optional; if omitted, the backend defaults it to `true`.

Duplicate handling notes:
- duplicates are detected using `category + questionText`
- duplicates are checked against both existing database records and repeated items inside the same import payload
- invalid items cause the whole request to fail with a validation error instead of partially importing invalid rows

Success response:

```json
{
  "success": true,
  "data": {
    "insertedCount": 2,
    "skippedCount": 1,
    "questions": [
      {
        "_id": "67f...",
        "questionText": "MongoDB is a ____ database.",
        "options": ["Relational", "NoSQL", "Graph", "In-memory"],
        "correctAnswer": 1,
        "category": "MongoDB",
        "isActive": true
      }
    ]
  }
}
```

Possible bulk import responses:
- `201 Created`: at least one new question was inserted
- `200 OK`: request was valid but all submitted questions were skipped as duplicates
- `400 Bad Request`: invalid request structure or item validation failure

## Common Error Responses

### `400 Bad Request`
Validation failed (missing field, invalid id, invalid options length, invalid correctAnswer range).

### `401 Unauthorized`
Missing or invalid JWT.

### `403 Forbidden`
Authenticated but not admin.

### `404 Not Found`
Target question id does not exist.

### `500 Internal Server Error`
Unexpected backend error.

## Quiz APIs

Quiz, leaderboard, and attempt history endpoints are fully implemented. See the self-hosted Swagger UI at `http://localhost:5000/api-docs` for interactive documentation.

### `GET /quiz/questions`
Get active questions for a new quiz session. Accepts optional `count` and `category` query params. Questions are randomized.

### `GET /quiz/categories`
Returns a sorted array of distinct category names derived from active questions.

### `POST /quiz/submit`
Submit answers for scoring. Body: `{ answers: [{ questionId, selectedAnswer }] }`. Returns score, total, and per-question correct/incorrect results. Rate limited.

### `GET /quiz/attempts`
Returns the authenticated user's quiz attempt history with full per-question review data, sorted newest to oldest.

### `GET /quiz/leaderboard`
Returns leaderboard entries. Supports `mode=best` (one best score per player) or `mode=all` (every attempt). Default limit is 20.
