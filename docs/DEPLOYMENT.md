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

App IDs (must match Firebase and `mobile/app.config.ts`):

- Android package: `com.gmsilver.app`
- iOS bundle ID: `com.gmsilver.app`

### Backend (Firebase Admin)

1. Create Firebase project.
2. Enable Cloud Messaging.
3. Project settings → Service accounts → Generate new private key.
4. Set in `.env.shared` (then run `scripts/sync-env.ps1`):
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (keep `\n` newlines as in `.env.shared.example`)
   - `FCM_SENDER_ID` (Project settings → Cloud Messaging → Sender ID)
5. Confirm backend logs `Firebase Admin initialized` on boot.
6. Validate with admin broadcast (`POST /notifications/send`) or Admin → Notifications.

### Mobile config files

1. Firebase Console → Add Android app (`com.gmsilver.app`) → download `google-services.json`.
2. Add iOS app (`com.gmsilver.app`) → download `GoogleService-Info.plist`.
3. Copy templates if needed, then replace with real downloads:

```bash
cp mobile/google-services.json.example mobile/google-services.json
cp mobile/GoogleService-Info.plist.example mobile/GoogleService-Info.plist
```

4. **iOS APNs:** Apple Developer → Keys → create APNs Auth Key (.p8) → Firebase → Project settings → Cloud Messaging → Apple app configuration → upload key.
5. From `mobile/` on **macOS** (required for iOS native folder): `npx expo prebuild`  
   On Windows, `expo prebuild` generates **Android only**; run the same command on a Mac to generate `ios/`.
6. Run on a **physical device** (iOS simulator has limited push support).

## 7. Mobile Release

- Android:
1. Configure app signing and Google services (`google-services.json`).
2. Build AAB using Gradle.
3. Upload to Play Console.

- iOS:
1. Configure provisioning profile, Push Notifications capability, and APNs for FCM.
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
