# CloudNest Drive

CloudNest Drive is a full-stack file storage app built with React, Express, MongoDB, Cloudinary, and Stripe. It supports account login, file uploads, folder organization, previews, sharing, trash recovery, and subscription-based storage limits.

## Project Structure

```text
backend/    Express API, MongoDB models, auth, uploads, billing, and storage logic
frontend/   React + Vite client
README.md   Project setup notes
render.yaml Render deployment blueprint for the API
```

## Features

- Email/password authentication with JWT access tokens and HttpOnly refresh cookies
- Google OAuth sign-in
- Protected dashboard routes
- File and folder upload flows
- Image, video, PDF, and document previews where supported by the browser
- Folder creation, search, copy, star, trash, restore, and permanent delete
- Public share links
- Storage quota tracking
- Stripe subscription checkout
- Cloudinary storage with a local development fallback

## Environment Setup

Copy the example files:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Frontend:

```env
VITE_API_URL=http://localhost:8080/api
```

Backend:

```env
PORT=8080
FRONTEND_URL=http://localhost:5173
SERVER_URL=http://localhost:8080
MONGODB_URI=mongodb://127.0.0.1:27017/cloudnest-drive
MONGODB_FALLBACK_URI=mongodb://127.0.0.1:27017/cloudnest-drive
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
DATABASE_REQUIRED=false
JWT_ACCESS_SECRET=replace-with-a-long-random-access-secret
JWT_REFRESH_SECRET=replace-with-a-long-random-refresh-secret
COOKIE_SECRET=replace-with-a-long-random-cookie-secret
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
```

## MongoDB

Use a local MongoDB database during development, or create a MongoDB Atlas cluster and place the connection string in `.env`.

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster-name.mongodb.net/cloudnest-drive?retryWrites=true&w=majority
```

For Atlas, make sure the database user exists and your current IP address is allowed under Network Access.

## Google OAuth

Create a Web application OAuth client in Google Cloud Console and add this redirect URI for local development:

```text
http://localhost:8080/api/auth/google/callback
```

Then set:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
```

The frontend starts the OAuth flow through `/api/auth/google`. The backend handles the callback, creates or updates the user, stores a refresh session, and the frontend restores the session through `/api/auth/refresh`.

You can check OAuth and database readiness with:

```bash
curl http://localhost:8080/api/auth/google/status
```

## Cloudinary

Cloudinary is used for real file storage. Add these values when you want uploaded files to be stored externally:

```env
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
CLOUDINARY_UPLOAD_FOLDER=cloudnest
CLOUDINARY_DIRECT_UPLOAD=false
CLOUDINARY_REQUIRED=false
```

Without Cloudinary credentials, development uploads still create MongoDB records and placeholder URLs. In production, set `CLOUDINARY_REQUIRED=true` if uploads should fail when external storage is unavailable.

## Stripe

```env
STRIPE_SECRET_KEY=sk_test_or_live
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...
```

If Stripe is not configured, checkout uses the local development flow.

## Install and Run

Install dependencies:

```bash
npm run install:all
```

Start frontend and backend together:

```bash
npm run dev
```

Start them separately:

```bash
npm run dev:backend
npm run dev:frontend
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:8080/health`

## Common Checks

```bash
npm run build
npm run smoke
npm run integration
npm --prefix frontend audit --audit-level=moderate
npm --prefix backend audit --audit-level=moderate
```

## Deployment Notes

### Frontend on Vercel

- Project root: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:

```env
VITE_API_URL=https://your-backend.example.com/api
```

### Backend on Render or Railway

- Project root: `backend`
- Blueprint file: `render.yaml` at the repository root
- Build command: `npm install`
- Start command: `npm start`
- Set `NODE_ENV=production`
- Set `FRONTEND_URL` to the frontend URL
- Set `SERVER_URL` to the backend URL
- Set `GOOGLE_OAUTH_CALLBACK_URL` to the production Google callback URL
- Configure MongoDB, Cloudinary, Stripe, and JWT secrets

## Troubleshooting

- Google login fails: check the OAuth client ID, client secret, callback URL, and authorized redirect URI.
- Refresh cookies fail in production: use HTTPS and set `NODE_ENV=production`.
- Upload is rejected: check the file type and size limits in `backend/src/middlewares/upload.js`.
- MongoDB connection fails: check the connection string, username, password, and Atlas IP allowlist.
- Dashboard is empty: upload files or check that the API is connected to the expected database.
