# GM Silver Mobile App

## Firebase push setup

**Android:** follow [`ANDROID_PUSH_SETUP.md`](./ANDROID_PUSH_SETUP.md).

**iOS:** follow [`IOS_PUSH_SETUP.md`](./IOS_PUSH_SETUP.md).

1. Create Android + iOS apps in Firebase with ID `com.gmsilver.app`.
2. Download configs and place at:
   - `google-services.json`
   - `GoogleService-Info.plist`
   (start from `*.example` if needed; real files are gitignored)
3. Upload an APNs Auth Key (`.p8`) to Firebase Cloud Messaging (iOS).
4. Ensure backend has `FIREBASE_*` env vars (see `docs/DEPLOYMENT.md`).
5. Native Android project is already generated under `android/`.
6. Build iOS via EAS from Windows (`eas.json`), or on a Mac with Xcode.
7. Run / install on a **physical device**.

## Run Local

1. Install dependencies

npm install

2. Native projects (once Firebase config files are in place)

npx expo prebuild

3. iOS (macOS only)

npx react-native run-ios

4. Android

npx react-native run-android

## Screens

Authentication:

- Splash
- Login
- Signup
- MPIN Login
- Create MPIN
- Forgot Password
- Reset Password
- Forgot MPIN
- Reset MPIN

Main:

- Home
- Categories
- Product Listing
- Product Detail
- Wishlist
- Cart
- Checkout
- Orders
- Order Detail
- Invoices
- Notifications
- Profile
- Settings
