-- CreateTable
CREATE TABLE "app_release_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "android_latest_version_name" TEXT NOT NULL DEFAULT '1.0.1',
    "android_latest_version_code" INTEGER NOT NULL DEFAULT 2,
    "android_min_version_code" INTEGER NOT NULL DEFAULT 1,
    "android_apk_url" TEXT,
    "android_force_update" BOOLEAN NOT NULL DEFAULT false,
    "ios_latest_version_name" TEXT NOT NULL DEFAULT '1.0.1',
    "ios_store_url" TEXT,
    "ios_force_update" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL DEFAULT 'A new version of GM Silver is available. Please download and install the latest APK.',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_release_config_pkey" PRIMARY KEY ("id")
);

-- Seed singleton row for testing: installed apps on versionCode 1 will see update popup
INSERT INTO "app_release_config" (
  "id",
  "android_latest_version_name",
  "android_latest_version_code",
  "android_min_version_code",
  "android_force_update",
  "ios_latest_version_name",
  "ios_force_update",
  "message",
  "enabled",
  "updated_at"
)
VALUES (
  'default',
  '1.0.1',
  2,
  1,
  false,
  '1.0.1',
  false,
  'A new version of GM Silver is available. Please download and install the latest APK.',
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "android_latest_version_name" = EXCLUDED."android_latest_version_name",
  "android_latest_version_code" = EXCLUDED."android_latest_version_code",
  "message" = EXCLUDED."message",
  "updated_at" = CURRENT_TIMESTAMP;
