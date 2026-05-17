# System Architecture

## Purpose
This document describes the architecture of the COMP5347 Assignment 2 quiz game.
It explains the frontend-backend-database structure, auth and admin access control, and the `Categorised quizzes` variation design.

## High-Level Architecture

```mermaid
flowchart LR
  Player[Player Browser]
  Admin[Admin Browser]
  React[React Frontend]
  API[Express REST API]
  AuthMW[protect middleware]
  AdminMW[requireAdmin middleware]
  Controllers[Controllers]
  Models[Mongoose Models]
  Mongo[(MongoDB quiz_game)]

  Player --> React
  Admin --> React
  React --> API
  API --> AuthMW
  AuthMW --> Controllers
  AuthMW --> AdminMW
  AdminMW --> Controllers
  Controllers --> Models
  Models --> Mongo
```

## Backend Module Structure

```mermaid
flowchart TB
  Server[server.js]
  AuthRoutes[/routes/auth.routes.js/]
  AdminRoutes[/routes/admin.routes.js/]
  AuthController[controllers/auth.controller.js]
  AdminController[controllers/admin.controller.js]
  Protect[middleware/auth.middleware.js]
  RequireAdmin[middleware/admin.middleware.js]
  UserModel[models/User.js]
  QuestionModel[models/Question.js]
  ScoreModel[models/Score.js]

  Server --> AuthRoutes
  Server --> AdminRoutes
  AuthRoutes --> AuthController
  AdminRoutes --> Protect
  AdminRoutes --> RequireAdmin
  AdminRoutes --> AdminController
  AuthController --> UserModel
  AdminController --> QuestionModel
  AuthController -. token payload .-> Protect
  ScoreModel -. used by quiz subsystem .- AdminController
```

## Data Model (Current Contract)

```mermaid
classDiagram
  class User {
    String username
    String password(hash)
    String role  // user | admin
    Date createdAt
    Date updatedAt
  }

  class Question {
    String questionText
    String[] options  // length = 4
    Number correctAnswer  // 0..3
    String category  // required
    Boolean isActive
    Date createdAt
    Date updatedAt
  }

  class Score {
    ObjectId user
    Number score
    Answer[] answers
    Date createdAt
  }

  class Answer {
    ObjectId questionId
    Number selectedAnswer
    Boolean isCorrect
  }

  Score --> User : belongs to
  Score --> Answer : contains
  Answer --> Question : references
```

## Request Flow: Admin CRUD

```mermaid
sequenceDiagram
  actor A as Admin User
  participant F as React Admin Page
  participant R as /api/admin routes
  participant P as protect
  participant G as requireAdmin
  participant C as admin.controller
  participant Q as Question Model
  participant DB as MongoDB

  A->>F: Submit create/edit/delete/toggle/bulk import
  F->>R: HTTP request + Bearer token
  R->>P: verify JWT
  P-->>R: req.user
  R->>G: check req.user.role === "admin"
  G-->>R: authorized
  R->>C: execute controller logic
  C->>Q: validate + query/write
  Q->>DB: database operation
  DB-->>Q: result
  Q-->>C: document(s)
  C-->>F: { success, data } or { success: false, error }
```

## Variation Integration: Categorised Quizzes
- `category` is a required field in `Question`.
- Admin create/edit/bulk-import all validate `category`.
- Quiz subsystem only fetches active questions from selected category.
- This design enforces the assignment requirement at both data and API layers.

## Security Notes
- Passwords are hashed with `bcrypt`.
- JWT is required for protected endpoints.
- Admin APIs enforce role-based access in backend middleware.
- API response envelope is consistent: `{ success, data?, error? }`.
