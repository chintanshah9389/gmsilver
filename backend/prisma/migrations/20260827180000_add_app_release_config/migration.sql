-- CreateTable
CREATE TABLE "app_release_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "android_latest_version_name" TEXT NOT NULL DEFAULT '1.0.0',
    "android_latest_version_code" INTEGER NOT NULL DEFAULT 1,
    "android_min_version_code" INTEGER NOT NULL DEFAULT 1,
    "android_apk_url" TEXT,
    "android_force_update" BOOLEAN NOT NULL DEFAULT false,
    "ios_latest_version_name" TEXT NOT NULL DEFAULT '1.0.0',
    "ios_store_url" TEXT,
    "ios_force_update" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL DEFAULT 'A new version of GM Silver is available. Please update to continue.',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_release_config_pkey" PRIMARY KEY ("id")
);

-- Seed singleton row
INSERT INTO "app_release_config" ("id", "updated_at")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
