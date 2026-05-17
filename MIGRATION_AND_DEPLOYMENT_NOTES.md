# Migration and Deployment Notes

## Repository Migration Summary

The original school/group project repository was copied into a new clean public GitHub repository:

- Source repository: `https://github.sydney.edu.au/ylen0654/2026-S1-COMP5347-Assignment2-Tut3-G4.git`
- New repository: `https://github.com/666junyichen/MERN-Categorised-Quiz-Game.git`

The new repository was created as a fresh Git repository, so it does not include the original school repository history.

## Files Excluded From the New Repository

School submission and course-related files were intentionally not copied into the new public repository, including:

- `Assignment 2 Group Assignment Coversheet.doc`
- Assignment requirement text files
- Lecture PDF files
- Individual reflection documents
- School/group-only documentation
- Local `.env` files
- `node_modules`
- Build output folders such as `dist`

## Files Kept in the New Repository

The public repository keeps the actual application code and useful project documentation:

- `backend/` Express API, MongoDB models, auth, admin, and quiz logic
- `frontend/` React/Vite client application
- `docs/api.md`
- `docs/architecture.md`
- `docs/admin-bulk-import-example.json`
- `README.md`
- Package lock files
- Environment example files

## Changes Made for Public Use

Several small changes were made to make the project easier to run and deploy:

- Rewrote `README.md` for a public GitHub repository.
- Added `frontend/.env.example`.
- Added `vercel.json` for frontend deployment from the repository root.
- Updated the backend server to use `process.env.PORT || 5000`, which is better for cloud deployment.

## Verification Completed

The project was checked after migration:

```bash
cd frontend
npm ci
npm run build
```

Frontend production build completed successfully.

```bash
cd backend
npm ci
node --test tests\*.test.js
```

Backend tests passed successfully.

## GitHub Push Status

The clean project was committed and pushed to GitHub:

```text
Commit: 3140de0 Initial public MERN quiz game
Branch: main
Remote: https://github.com/666junyichen/MERN-Categorised-Quiz-Game.git
```

## Vercel Deployment Notes

The Vercel project has been created and connected to the GitHub repository:

```text
666junyichen/MERN-Categorised-Quiz-Game
```

Vercel detected two services and updated `vercel.json`:

- `frontend` serves the React/Vite app at `/`
- `backend` serves the Express API at `/_/backend`

Set this frontend environment variable in Vercel:

```env
VITE_API_BASE_URL=/_/backend/api
```

This value has already been added for the Vercel Production environment.

## Backend Deployment Notes

The backend needs these environment variables:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=1d
ADMIN_REGISTER_SECRET=your_admin_registration_secret
```

MongoDB Atlas is recommended for the hosted database. Local MongoDB is fine for local development, but it will not work for a deployed Vercel backend because Vercel cannot connect to `localhost` on your computer.

After adding the backend environment variables, trigger a Vercel production deployment from the connected GitHub repository or with:

```bash
vercel --prod
```

## Local Clean Copy

The clean local copy is located at:

```text
C:\研二上COMP5347web application\assignment2 小组\2026-S1-COMP5347-Assignment2-Tut3-G4\MERN-Categorised-Quiz-Game
```
