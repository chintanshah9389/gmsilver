-- Bump latest Android version for in-app update testing (installed APK stays at code 1)
UPDATE "app_release_config"
SET
  "android_latest_version_name" = '1.0.1',
  "android_latest_version_code" = 2,
  "android_min_version_code" = 1,
  "android_force_update" = false,
  "ios_latest_version_name" = '1.0.1',
  "message" = 'A new version of GM Silver is available. Please download and install the latest APK.',
  "enabled" = true,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'default';
