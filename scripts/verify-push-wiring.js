/**
 * Smoke checks for FCM push wiring (no live device / Firebase required).
 * Run: node scripts/verify-push-wiring.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

assert(exists('mobile/app.config.ts'), 'mobile/app.config.ts missing');
assert(exists('mobile/google-services.json.example'), 'Android Firebase example missing');
assert(exists('mobile/GoogleService-Info.plist.example'), 'iOS Firebase example missing');
assert(exists('mobile/src/services/pushNotifications.ts'), 'pushNotifications service missing');
assert(exists('mobile/android/app/build.gradle'), 'Android project missing (run expo prebuild)');
assert(
  exists('mobile/android/app/google-services.json') ||
    exists('mobile/google-services.json') ||
    exists('mobile/google-services.json.example'),
  'No google-services config found',
);

const appConfig = read('mobile/app.config.ts');
assert(appConfig.includes("package: 'com.gmsilver.app'"), 'Android package not set');
assert(appConfig.includes("bundleIdentifier: 'com.gmsilver.app'"), 'iOS bundle id not set');
assert(appConfig.includes('@react-native-firebase/messaging'), 'Firebase messaging plugin missing');

const androidGradle = read('mobile/android/app/build.gradle');
assert(
  androidGradle.includes("com.google.gms.google-services"),
  'google-services plugin not applied in Android build.gradle',
);

const manifest = read('mobile/android/app/src/main/AndroidManifest.xml');
assert(
  manifest.includes('POST_NOTIFICATIONS'),
  'POST_NOTIFICATIONS permission missing from AndroidManifest',
);

const usersService = read('backend/src/modules/users/users.service.ts');
assert(
  usersService.includes('notifyUserApproved'),
  'notifyUserApproved not wired in users.service',
);

const mpinDto = read('backend/src/modules/auth/dto/mpin-login.dto.ts');
assert(mpinDto.includes('fcmToken'), 'fcmToken missing from MpinLoginDto');

const authService = read('backend/src/modules/auth/auth.service.ts');
assert(
  authService.includes('dto.fcmToken') && authService.includes('mpinLogin'),
  'mpinLogin should persist fcmToken',
);

const loginScreen = read('mobile/src/screens/auth/LoginScreen.tsx');
assert(loginScreen.includes('getFcmToken'), 'LoginScreen does not register FCM token');

const mpinScreen = read('mobile/src/screens/auth/MpinLoginScreen.tsx');
assert(mpinScreen.includes('getFcmToken'), 'MpinLoginScreen does not register FCM token');

const notificationsApi = read('mobile/src/store/services/notificationsApi.ts');
assert(
  notificationsApi.includes('fcm-token'),
  'notificationsApi missing updateFcmToken endpoint',
);

if (!exists('mobile/ios')) {
  console.warn(
    '[warn] mobile/ios not generated — run `npx expo prebuild --platform ios` on macOS.',
  );
}

if (failures.length) {
  console.error('Push wiring verification FAILED:');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}

console.log('Push wiring verification OK');
console.log('Next (device): replace placeholder Firebase configs, set FIREBASE_* env, login, broadcast.');
