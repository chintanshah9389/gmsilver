-- AlterTable
ALTER TABLE "app_release_config"
ADD COLUMN IF NOT EXISTS "android_apk_storage_key" TEXT,
ADD COLUMN IF NOT EXISTS "android_distribution_mode" TEXT NOT NULL DEFAULT 'DIRECT_APK',
ADD COLUMN IF NOT EXISTS "android_play_store_url" TEXT;
