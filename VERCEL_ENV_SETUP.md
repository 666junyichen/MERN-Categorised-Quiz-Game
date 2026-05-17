# Vercel Environment Variables Setup

Use this file as a checklist when configuring the Vercel project environment variables.

Do not paste real secrets into this repository. Add the real values directly in the Vercel dashboard or with the Vercel CLI.

## Vercel Project

```text
Project: mern-categorised-quiz-game
Frontend API base URL: /_/backend/api
```

## Required Backend Variables

Add these variables to the Vercel project environment settings.

```env
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=1d
ADMIN_REGISTER_SECRET=
```

## What To Fill In

### MONGO_URI

Use your MongoDB Atlas connection string.

Example format:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/quiz_game?retryWrites=true&w=majority
```

Replace:

- `<username>` with your Atlas database user
- `<password>` with that database user's password
- `<cluster-name>` with your Atlas cluster host
- `quiz_game` with the database name you want this app to use

Local MongoDB values such as `mongodb://127.0.0.1:27017/quiz_game` are only for local development and should not be used for the deployed Vercel backend.

### JWT_SECRET

Use a long random secret for signing login tokens.

Example placeholder:

```env
JWT_SECRET=replace_with_a_long_random_secret
```

Generate a strong value with a password manager, OpenSSL, or another secure random generator.

### JWT_EXPIRES_IN

This controls how long login tokens stay valid.

Recommended default:

```env
JWT_EXPIRES_IN=1d
```

### ADMIN_REGISTER_SECRET

Use a separate secret for creating admin accounts.

Example placeholder:

```env
ADMIN_REGISTER_SECRET=replace_with_a_different_long_random_secret
```

Keep this different from `JWT_SECRET`.

## Already Configured Frontend Variable

This production variable has already been added to Vercel:

```env
VITE_API_BASE_URL=/_/backend/api
```

## After Filling The Variables

After adding the backend variables in Vercel, redeploy the project from the Vercel dashboard or run:

```bash
vercel --prod
```

