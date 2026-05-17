# MERN Categorised Quiz Game

A full-stack quiz game built with MongoDB, Express, React, and Node.js. Players can register, log in, choose quiz categories, complete quiz attempts, and view leaderboard results. Admin users can manage questions, toggle active status, and bulk import question sets.

## Live Demo

[https://mern-categorised-quiz-game.vercel.app](https://mern-categorised-quiz-game.vercel.app)

## Features

- JWT authentication with user and admin roles
- Categorised quiz selection
- Configurable question count
- Score submission, attempt history, and leaderboard
- Admin question CRUD
- Bulk question import with duplicate skipping
- Light and dark theme toggle
- Swagger API docs for the backend

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, React Hook Form, Zod
- Backend: Node.js, Express, Mongoose, JWT, bcrypt
- Database: MongoDB
- API docs: Swagger UI

## Project Structure

```text
backend/   Express API, MongoDB models, auth, admin, quiz routes
frontend/  React/Vite client application
docs/      API and architecture notes
```

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Update `backend/.env` with your own values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/quiz_game
JWT_SECRET=replace_with_secure_secret
JWT_EXPIRES_IN=1d
ADMIN_REGISTER_SECRET=replace_with_admin_secret
```

Backend URLs:

- API: `http://localhost:5000/api`
- Swagger UI: `http://localhost:5000/api-docs`
- OpenAPI JSON: `http://localhost:5000/api-docs.json`

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend URL:

- `http://localhost:5173`

## Deployment Notes

The included `vercel.json` is set up for a Vercel project with two services:

- `frontend` serves the React/Vite app at `/`
- `backend` serves the Express API at `/_/backend`

In Vercel, set this frontend environment variable:

```env
VITE_API_BASE_URL=/_/backend/api
```

The backend also needs these environment variables:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=1d
ADMIN_REGISTER_SECRET=your_admin_registration_secret
```

Use [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md) as a checklist when filling these values in Vercel.

Use local MongoDB for local development only. For Vercel deployment, use MongoDB Atlas or another hosted MongoDB instance that Vercel can reach over the public network.

## API Documentation

Detailed endpoint notes are available in [docs/api.md](docs/api.md). Architecture notes are available in [docs/architecture.md](docs/architecture.md).

## Bulk Import

An example admin bulk import payload is available at [docs/admin-bulk-import-example.json](docs/admin-bulk-import-example.json).
