# Android Push Setup (do this first)

Use package name **`com.gmsilver.app`** everywhere (already set in the app).

## 1. Firebase Console (Android only for now)

1. Open [Firebase Console](https://console.firebase.google.com/) → create or select project.
2. Add an **Android** app:
   - Package name: `com.gmsilver.app`
   - App nickname: GM Silver (optional)
3. Download **`google-services.json`**.
4. Replace both copies:
   - `mobile/google-services.json`
   - `mobile/android/app/google-services.json`
5. Project settings → **Service accounts** → Generate new private key.
6. Put these in `.env.shared` (then run `pwsh scripts/sync-env.ps1`):

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FCM_SENDER_ID=...   # Project settings → Cloud Messaging → Sender ID
```

7. Restart backend and confirm log: `Firebase Admin initialized`.

Skip iOS / APNs until Android works.

## 2. Run on a physical Android device

```bash
cd mobile
npm install
npx react-native run-android
```

Login → allow notifications → check DB `users.fcm_token` is filled.

## 3. Test push

Admin panel → Notifications → broadcast, or:

`POST /api/v1/notifications/send` with title/body.

You should get a system notification on the locked/background device.
