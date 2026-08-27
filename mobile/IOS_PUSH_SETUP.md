# iOS Push Setup

Bundle ID: **`com.gmsilver.app`** (must match Apple Developer, Firebase, and `app.config.ts`).

You can prepare these files on Windows. Building/installing the IPA still needs EAS (cloud Mac) or a Mac.

## 1. Firebase — add iOS app

1. Open [Firebase Console](https://console.firebase.google.com/) → project **gmsliver**.
2. Add an **iOS** app:
   - Bundle ID: `com.gmsilver.app`
   - App nickname: GM Silver (optional)
3. Download **`GoogleService-Info.plist`**.
4. Replace:
   - `mobile/GoogleService-Info.plist`
5. Keep the example in sync if you want:
   - `mobile/GoogleService-Info.plist.example`

The file already has project id / sender id / API key filled; **`GOOGLE_APP_ID` must come from this download** (it is unique per iOS app).

## 2. Apple — APNs key → Firebase

1. [Apple Developer](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles** → **Keys**.
2. Create a key with **Apple Push Notifications service (APNs)** enabled.
3. Download the `.p8` file once; note **Key ID** and your **Team ID**.
4. Firebase → Project settings → **Cloud Messaging** → Apple app configuration → upload the APNs Auth Key (`.p8` + Key ID + Team ID).

## 3. App config (already wired)

- `UIBackgroundModes: remote-notification`
- Push entitlements (`aps-environment`)
- `@react-native-firebase/messaging` plugin
- FCM token registration in `src/services/pushNotifications.ts`

No extra backend changes: same FCM send path works for iOS tokens.

## 4. Build IPA from Windows (EAS)

```bash
cd mobile
npm install
npx eas-cli login
npx eas build:configure   # once
npx eas build --platform ios --profile production
```

Install via TestFlight on a **physical iPhone**, allow notifications, log in, then confirm `users.fcm_token` in the DB.

## 5. Test

Admin panel → Notifications → broadcast, or `POST /api/v1/notifications/send`.

You should get a system notification when the app is backgrounded or locked.
