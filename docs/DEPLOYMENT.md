# GM Silver Deployment Guide

## 1. Environments

- Development: local Docker + React Native emulator
- Staging: Vercel projects + staging PostgreSQL + staging R2 + staging Firebase
- Production: Vercel projects + managed PostgreSQL + production R2 + production Firebase

## 2. Backend Deployment (Railway)

1. Create a Railway service with root directory `backend`.
2. Build command:

npm ci
npm run build
npx prisma generate

3. Start command:

npm run railway:start

4. Set environment variables from `backend/.env.example`.
5. Deploy and validate `/api/v1`.

### Required Backend Environment Variables

- DATABASE_URL
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET
- R2_ACCOUNT_ID
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET
- R2_PUBLIC_URL
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
- CORS_ORIGINS

## 3. Admin Panel Deployment (Vercel)

1. Import admin-panel folder as a separate Vercel project.
2. Build command: npm run build
3. Set NEXT_PUBLIC_API_URL to backend production URL.
4. Deploy.

## 4. Database Migrations

Run on CI or deployment hook:

npm run prisma:deploy

Seed once if needed:

npm run prisma:seed

## 5. Cloudflare R2 Setup

1. Create bucket: gm-silver
2. Create API token with object read/write permissions.
3. Configure public domain and set R2_PUBLIC_URL.
4. Validate upload via /storage/upload/image endpoint.

## 6. Firebase FCM Setup

1. Create Firebase project.
2. Enable Cloud Messaging.
3. Generate service account JSON.
4. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
5. Validate with broadcast test endpoint.

## 7. Mobile Release

- Android:
1. Configure app signing and Google services.
2. Build AAB using Gradle.
3. Upload to Play Console.

- iOS:
1. Configure provisioning profile and APNS for FCM.
2. Archive in Xcode.
3. Upload to App Store Connect.

## 8. Production Hardening Checklist

- Enforce HTTPS and secure cookies on admin panel.
- Enable WAF / rate limiting in front of backend.
- Rotate JWT and R2 secrets periodically.
- Enable DB backups and point-in-time recovery.
- Add uptime monitoring and error tracking (Sentry).
- Configure log retention and alerting.
- Run security scans in CI.

## 9. Single Local Env Source

For local development, use one root file:

1. Copy `.env.shared.example` to `.env.shared`.
2. Edit values in `.env.shared` only.
3. Run `start-local.bat` or `start.run.bat`.

The script `scripts/sync-env.ps1` generates:

- `backend/.env`
- `admin-panel/.env`
- `mobile/.env`
